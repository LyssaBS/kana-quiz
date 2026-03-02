import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DataService } from '../../../core/data.service';
import { QuizService } from '../../../core/quiz.service';
import { QuizQuestion, KanaItem } from '../../../core/models';

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; chosenIndex: number }
  | { status: 'wrong'; chosenIndex: number; correctIndex: number };

@Component({
  selector: 'app-kana-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './kana-quiz.html',
})
export class KanaQuizComponent implements OnInit {
  items: KanaItem[] = [];
  question: QuizQuestion | null = null;
  feedback: FeedbackState = { status: 'idle' };
  recentIds: string[] = [];
  repeatBlockSpan = 5;
  errorMsg: string | null = null;
  script: 'hira' | 'kata' = 'hira';

  constructor(
    private data: DataService,
    private quiz: QuizService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    try {
      this.script = (this.route.snapshot.data['script'] as 'hira' | 'kata') ?? 'hira';
      this.items = await this.data.loadKana();
      if (!this.items || this.items.length === 0) {
        this.errorMsg = 'kana.json caricato, ma è vuoto.';
        return;
        }
      this.nextQuestion();
      this.cd.detectChanges();
    } catch (e: any) {
      this.errorMsg = 'Errore nel caricamento di kana.json: ' + (e?.message ?? String(e));
    }
  }

  get canGoNext(): boolean {
    return this.feedback.status !== 'idle';
  }

  nextQuestion() {
    try {
      this.feedback = { status: 'idle' };
      this.question = this.quiz.buildNextKanaQuestion(this.items, this.script, 5, this.recentIds);
      if (this.question) {
        this.recentIds.push(this.question.itemId);
        if (this.recentIds.length > this.repeatBlockSpan) this.recentIds.shift();
      }
      this.cd.detectChanges();
    } catch (e: any) {
      this.errorMsg = 'Errore nel generare la domanda: ' + (e?.message ?? String(e));
      this.question = null;
    }
  }

  choose(index: number) {
    if (!this.question) return;
    if (this.feedback.status !== 'idle') return;
    const isCorrect = index === this.question.correctIndex;
    this.feedback = isCorrect
      ? { status: 'correct', chosenIndex: index }
      : { status: 'wrong', chosenIndex: index, correctIndex: this.question.correctIndex };
    this.cd.detectChanges();
  }
}
