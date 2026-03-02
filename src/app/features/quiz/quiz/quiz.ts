import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { RouterModule } from '@angular/router';
import { DataService } from '../../../core/data.service';
import { QuizService } from '../../../core/quiz.service';
import { QuizQuestion, VocabItem, VerbItem, AdjectiveItem } from '../../../core/models';

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; chosenIndex: number }
  | { status: 'wrong'; chosenIndex: number; correctIndex: number };

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MultiSelect],
  templateUrl: './quiz.html',
})
export class QuizComponent implements OnInit {
  items: VocabItem[] = [];
  allItems: VocabItem[] = [];
  availableLessons: number[] = [];
  selectedLessons: number[] = [];
  categoryOptions = [
    { label: 'Tutto', value: 'tutto' },
    { label: 'Aggettivi', value: 'aggettivi' },
    { label: 'Verbi', value: 'verbi' },
  ];
  selectedCategories: string[] = [];
  lessonOptions: { label: string; value: number }[] = [];
  question: QuizQuestion | null = null;

  feedback: FeedbackState = { status: 'idle' };
  recentIds: string[] = [];
  repeatBlockSpan = 3;

  correctCount = 0;
  wrongCount = 0;

  errorMsg: string | null = null;

  constructor(private data: DataService, private quiz: QuizService, private cd: ChangeDetectorRef) {}

  async ngOnInit() {
    try {
      const [vocab, verbs, adjs] = await Promise.all([
        this.data.loadVocab(),
        this.data.loadVerbs(),
        this.data.loadAdjectives(),
      ]);

      const mappedVerbs: VocabItem[] = (verbs as VerbItem[]).map((v) => ({
        id: v.id,
        pos: 'verb',
        level: v.level,
        lesson: (v as any).lesson,
        headword: v.headword,
        reading: v.reading,
        meaningsIt: v.meaningsIt,
      }));

      const mappedAdjs: VocabItem[] = (adjs as AdjectiveItem[]).map((a) => ({
        id: a.id,
        pos: a.type === 'i' ? 'adj-i' : 'adj-na',
        level: a.level,
        lesson: (a as any).lesson,
        headword: a.headword,
        reading: a.reading,
        meaningsIt: a.meaningsIt,
      }));

      this.allItems = [...vocab, ...mappedVerbs, ...mappedAdjs];
      this.availableLessons = Array.from(
        new Set(this.allItems.map((x) => x.lesson).filter((x): x is number => typeof x === 'number'))
      ).sort((a, b) => a - b);
      this.lessonOptions = this.availableLessons.map((l) => ({ label: String(l), value: l }));
      this.applyFilters();

      if (!this.items || this.items.length === 0) {
        this.errorMsg = 'Nessun dato disponibile (vocab/verbs/adjectives vuoti).';
        return;
      }

      this.nextQuestion();
      this.cd.detectChanges();
    } catch (e: any) {
      this.errorMsg =
        'Errore nel caricamento dei dati: ' + (e?.message ?? String(e));
    }
  }

  nextQuestion() {
    try {
      this.feedback = { status: 'idle' };
      this.question = this.quiz.buildNextVocabMcQuestion(this.items, 4, this.recentIds);
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
    if (this.feedback.status !== 'idle') return; // blocca doppio click

    const isCorrect = index === this.question.correctIndex;
    if (isCorrect) {
      this.correctCount++;
      this.feedback = { status: 'correct', chosenIndex: index };
    } else {
      this.wrongCount++;
      this.feedback = {
        status: 'wrong',
        chosenIndex: index,
        correctIndex: this.question.correctIndex,
      };
    }
    this.cd.detectChanges();
  }



  get canGoNext(): boolean {
    return this.feedback.status !== 'idle';
  }

  resetScore() {
    this.correctCount = 0;
    this.wrongCount = 0;
    this.recentIds = [];
    this.nextQuestion();
  }

  applyFilters() {
    const byLesson = (item: VocabItem) =>
      this.selectedLessons.length === 0 ? true : (item.lesson !== undefined && this.selectedLessons.includes(item.lesson));
    const byCategory = (item: VocabItem) => {
      if (this.selectedCategories.length === 0 || this.selectedCategories.includes('tutto')) return true;
      const isVerb = item.pos === 'verb';
      const isAdj = item.pos === 'adj-i' || item.pos === 'adj-na';
      const wantVerb = this.selectedCategories.includes('verbi');
      const wantAdj = this.selectedCategories.includes('aggettivi');
      if (wantVerb && isVerb) return true;
      if (wantAdj && isAdj) return true;
      return false;
    };
    this.items = this.allItems.filter(byLesson).filter(byCategory);
    this.feedback = { status: 'idle' };
    this.recentIds = [];
    if (this.items.length === 0) {
      this.errorMsg = 'Nessun elemento per i filtri selezionati.';
      this.question = null;
    } else {
      this.errorMsg = null;
      this.nextQuestion();
    }
  }
}
