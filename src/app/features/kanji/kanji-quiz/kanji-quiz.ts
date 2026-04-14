import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MultiSelect } from 'primeng/multiselect';
import { DataService } from '../../../core/data.service';
import { QuizService } from '../../../core/quiz.service';
import { KanjiItem, QuizQuestion } from '../../../core/models';

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; chosenIndex: number }
  | { status: 'wrong'; chosenIndex: number; correctIndex: number };

@Component({
  selector: 'app-kanji-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MultiSelect],
  templateUrl: './kanji-quiz.html',
})
export class KanjiQuizComponent implements OnInit {
  readonly quickLessonRangeValue = -999;
  items: KanjiItem[] = [];
  allItems: KanjiItem[] = [];
  availableLessons: number[] = [];
  lessonOptions: { label: string; value: number }[] = [];
  selectedLessons: number[] = [];
  question: QuizQuestion | null = null;
  feedback: FeedbackState = { status: 'idle' };
  recentIds: string[] = [];
  repeatBlockSpan = 5;
  errorMsg: string | null = null;

  constructor(
    private data: DataService,
    private quiz: QuizService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    try {
      this.allItems = await this.data.loadKanji();
      if (!this.allItems || this.allItems.length === 0) {
        this.errorMsg = 'kanji.json caricato, ma è vuoto.';
        return;
      }

      this.availableLessons = Array.from(
        new Set(this.allItems.map((x) => x.lezione).filter((x): x is number => typeof x === 'number'))
      ).sort((a, b) => a - b);
      this.lessonOptions = this.availableLessons.map((l) => ({ label: `Lezione ${l}`, value: l }));
      if (this.availableLessons.length > 26) {
        this.lessonOptions.unshift({ label: 'Lezioni 0-25', value: this.quickLessonRangeValue });
      }
      this.applyFilters();
      this.cd.detectChanges();
    } catch (e: any) {
      this.errorMsg = 'Errore nel caricamento di kanji.json: ' + (e?.message ?? String(e));
    }
  }

  get canGoNext(): boolean {
    return this.feedback.status !== 'idle';
  }

  nextQuestion() {
    try {
      this.feedback = { status: 'idle' };
      this.question = this.quiz.buildNextKanjiQuestion(this.items, 4, this.recentIds);
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

  onLessonsChange() {
    if (this.selectedLessons.includes(this.quickLessonRangeValue)) {
      this.selectedLessons = this.availableLessons.filter((lesson) => lesson >= 0 && lesson <= 25);
    }
    this.applyFilters();
  }

  applyFilters() {
    this.items =
      this.selectedLessons.length === 0
        ? this.allItems
        : this.allItems.filter((x) => this.selectedLessons.includes(x.lezione));
    this.feedback = { status: 'idle' };
    this.recentIds = [];
    if (this.items.length === 0) {
      this.errorMsg = 'Nessun kanji per le lezioni selezionate.';
      this.question = null;
    } else {
      this.errorMsg = null;
      this.nextQuestion();
    }
  }
}
