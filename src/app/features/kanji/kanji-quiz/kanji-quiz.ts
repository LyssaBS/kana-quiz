import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { DataService } from '../../../core/data.service';
import { QuizService, KanjiQuestionType } from '../../../core/quiz.service';
import { KanjiItem, KanjiLevel, QuizQuestion } from '../../../core/models';

type FeedbackState =
  | { status: 'idle' }
  | { status: 'correct'; chosenIndex: number }
  | { status: 'wrong'; chosenIndex: number; correctIndex: number };

@Component({
  selector: 'app-kanji-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelect],
  templateUrl: './kanji-quiz.html',
})
export class KanjiQuizComponent implements OnInit {
  items: KanjiItem[] = [];
  allItems: KanjiItem[] = [];

  levelOptions: { label: string; value: KanjiLevel }[] = [];
  selectedLevels: KanjiLevel[] = [];

  lessonOptions: { label: string; value: string }[] = [];
  selectedLessons: string[] = [];

  typeOptions: { label: string; value: KanjiQuestionType }[] = [
    { label: 'Significato', value: 'meaning' },
    { label: 'Lettura on', value: 'on' },
    { label: 'Lettura kun', value: 'kun' },
    { label: 'Scheda completa', value: 'flashcard' },
  ];
  selectedTypes: KanjiQuestionType[] = ['meaning', 'on', 'kun', 'flashcard'];

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

      const availableLevels = Array.from(new Set(this.allItems.map((x) => x.livello)));
      this.levelOptions = availableLevels.map((l) => ({ label: l, value: l }));

      this.refreshLessonOptions();
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
      this.question = this.quiz.buildNextKanjiQuestion(this.items, 4, this.recentIds, this.selectedTypes);
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

  onLevelsChange() {
    this.refreshLessonOptions();
    const validValues = new Set(this.lessonOptions.map((o) => o.value));
    this.selectedLessons = this.selectedLessons.filter((v) => validValues.has(v));
    this.applyFilters();
  }

  onLessonsChange() {
    this.applyFilters();
  }

  onTypesChange() {
    this.applyFilters();
  }

  private lessonKey(item: KanjiItem): string {
    return `${item.livello}|${item.lezione}`;
  }

  private levelFilteredItems(): KanjiItem[] {
    return this.selectedLevels.length === 0
      ? this.allItems
      : this.allItems.filter((x) => this.selectedLevels.includes(x.livello));
  }

  private refreshLessonOptions() {
    const pairs = Array.from(new Set(this.levelFilteredItems().map((x) => this.lessonKey(x))));
    pairs.sort((a, b) => {
      const [levelA, lessonA] = a.split('|');
      const [levelB, lessonB] = b.split('|');
      return levelA !== levelB ? levelA.localeCompare(levelB) : Number(lessonA) - Number(lessonB);
    });
    this.lessonOptions = pairs.map((key) => {
      const [level, lesson] = key.split('|');
      return { label: `${level} - Lezione ${lesson}`, value: key };
    });
  }

  applyFilters() {
    const levelFiltered = this.levelFilteredItems();
    this.items =
      this.selectedLessons.length === 0
        ? levelFiltered
        : levelFiltered.filter((x) => this.selectedLessons.includes(this.lessonKey(x)));
    this.feedback = { status: 'idle' };
    this.recentIds = [];
    if (this.items.length === 0) {
      this.errorMsg = 'Nessun kanji per i filtri selezionati.';
      this.question = null;
    } else {
      this.errorMsg = null;
      this.nextQuestion();
    }
  }
}
