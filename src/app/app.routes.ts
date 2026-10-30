import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { KanjiQuizComponent } from './features/kanji/kanji-quiz/kanji-quiz';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'quiz', component: KanjiQuizComponent, data: { mode: 'quiz' } },
  { path: 'parola', component: KanjiQuizComponent, data: { mode: 'parola' } },
  { path: 'inverso', component: KanjiQuizComponent, data: { mode: 'inverso' } },
];
