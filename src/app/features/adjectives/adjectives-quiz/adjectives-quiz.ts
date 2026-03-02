import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../core/data.service';
import { QuizService } from '../../../core/quiz.service';
import { QuizQuestion, AdjectiveItem } from '../../../core/models';

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; chosenIndex: number }
  | { status: 'wrong'; chosenIndex: number; correctIndex: number };

@Component({
  selector: 'app-adjectives-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MultiSelect],
  templateUrl: './adjectives-quiz.html',
})
export class AdjectivesQuizComponent implements OnInit {
  items: AdjectiveItem[] = [];
  allItems: AdjectiveItem[] = [];
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
      this.allItems = await this.data.loadAdjectives();
      if (!this.allItems || this.allItems.length === 0) {
        this.errorMsg = 'adjectives.json caricato, ma è vuoto.';
        return;
      }
      this.availableLessons = Array.from(
        new Set(this.allItems.map((x: any) => x.lesson).filter((x): x is number => typeof x === 'number'))
      ).sort((a, b) => a - b);
      this.lessonOptions = this.availableLessons.map((l) => ({ label: String(l), value: l }));
      this.applyFilters();
      this.nextQuestion();
      this.cd.detectChanges();
    } catch (e: any) {
      this.errorMsg = 'Errore nel caricamento di adjectives.json: ' + (e?.message ?? String(e));
    }
  }

  get canGoNext(): boolean {
    return this.feedback.status !== 'idle';
  }

  nextQuestion() {
    try {
      this.feedback = { status: 'idle' };
      this.question = this.quiz.buildNextAdjectiveConjugationQuestion(this.items, 4, this.recentIds);
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

  applyFilters() {
    this.items =
      this.selectedLessons.length === 0
        ? this.allItems
        : this.allItems.filter((x: any) => typeof x.lesson === 'number' && this.selectedLessons.includes(x.lesson));
    this.feedback = { status: 'idle' };
    this.recentIds = [];
    if (this.items.length === 0) {
      this.errorMsg = 'Nessun aggettivo per le lezioni selezionate.';
      this.question = null;
    } else {
      this.errorMsg = null;
      this.nextQuestion();
    }
  }
}
