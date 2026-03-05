import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home/home';
import { QuizComponent } from './features/quiz/quiz/quiz';
import { KanaQuizComponent } from './features/kana/kana-quiz/kana-quiz';
import { VerbsQuizComponent } from './features/verbs/verbs-quiz/verbs-quiz';
import { AdjectivesQuizComponent } from './features/adjectives/adjectives-quiz/adjectives-quiz';


export const routes: Routes = [
  { path: '', redirectTo: 'quiz', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'quiz', component: QuizComponent },
  { path: 'kana/hiragana', component: KanaQuizComponent, data: { script: 'hira' } },
  { path: 'kana/katakana', component: KanaQuizComponent, data: { script: 'kata' } },
  { path: 'verbs/meaning', component: VerbsQuizComponent, data: { mode: 'meaning' } },
  { path: 'verbs/conjugation', component: VerbsQuizComponent, data: { mode: 'conjugation' } },
  { path: 'adjectives/conjugation', component: AdjectivesQuizComponent },
];
