import { Injectable } from '@angular/core';
import { QuizQuestion, KanjiItem } from './models';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type KanjiQuestionType = 'meaning' | 'on' | 'kun' | 'flashcard';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private formatFlashcard(item: KanjiItem): string {
    const parts = [item.significato.join(', ')];
    if (item.lettura_on.length) parts.push(`on: ${item.lettura_on.join('/')}`);
    if (item.lettura_kun.length) parts.push(`kun: ${item.lettura_kun.join('/')}`);
    return parts.join(' — ');
  }

  buildNextKanjiQuestion(
    items: KanjiItem[],
    choicesCount = 4,
    excludeIds: string[] = [],
    allowedTypes: KanjiQuestionType[] = ['meaning', 'kun', 'on', 'flashcard']
  ): QuizQuestion {
    if (items.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} kanji per fare multiple choice.`);
    }

    const pool = items.filter((x) => !excludeIds.includes(String(x.numero)));
    const pickFrom = pool.length > 0 ? pool : items;

    for (const item of shuffle(pickFrom)) {
      const validKinds: KanjiQuestionType[] = [];

      const meaningDistractors = shuffle(
        items
          .filter((x) => x.numero !== item.numero)
          .flatMap((x) => x.significato)
      ).filter((m, idx, self) => self.indexOf(m) === idx && !item.significato.includes(m));

      if (allowedTypes.includes('meaning') && meaningDistractors.length >= choicesCount - 1) {
        validKinds.push('meaning');
      }

      const kunDistractors = shuffle(
        items.filter((x) => x.numero !== item.numero).flatMap((x) => x.lettura_kun ?? [])
      ).filter((m, idx, self) => self.indexOf(m) === idx);

      if (
        allowedTypes.includes('kun') &&
        (item.lettura_kun?.length ?? 0) > 0 &&
        kunDistractors.length >= choicesCount - 1
      ) {
        validKinds.push('kun');
      }

      const onDistractors = shuffle(
        items.filter((x) => x.numero !== item.numero).flatMap((x) => x.lettura_on ?? [])
      ).filter((m, idx, self) => self.indexOf(m) === idx);

      if (
        allowedTypes.includes('on') &&
        (item.lettura_on?.length ?? 0) > 0 &&
        onDistractors.length >= choicesCount - 1
      ) {
        validKinds.push('on');
      }

      const correctFlashcard = this.formatFlashcard(item);
      const flashcardDistractors = shuffle(
        items.filter((x) => x.numero !== item.numero).map((x) => this.formatFlashcard(x))
      ).filter((m, idx, self) => self.indexOf(m) === idx && m !== correctFlashcard);

      if (allowedTypes.includes('flashcard') && flashcardDistractors.length >= choicesCount - 1) {
        validKinds.push('flashcard');
      }

      if (validKinds.length === 0) {
        continue;
      }

      const kind = validKinds[Math.floor(Math.random() * validKinds.length)];

      if (kind === 'meaning') {
        const correct = item.significato[Math.floor(Math.random() * item.significato.length)];
        const choices = shuffle([correct, ...meaningDistractors.slice(0, choicesCount - 1)]);
        return {
          prompt: item.kanji,
          reading: 'Scegli il significato',
          choices,
          correctIndex: choices.indexOf(correct),
          itemId: String(item.numero),
        };
      }

      if (kind === 'flashcard') {
        const distractors = flashcardDistractors.slice(0, choicesCount - 1);
        const choices = shuffle([correctFlashcard, ...distractors]);
        return {
          prompt: item.kanji,
          reading: 'Scegli significato, on e kun corretti',
          choices,
          correctIndex: choices.indexOf(correctFlashcard),
          itemId: String(item.numero),
        };
      }

      const readings = kind === 'kun' ? item.lettura_kun : item.lettura_on;
      const correct = readings[Math.floor(Math.random() * readings.length)];
      const distractors = (kind === 'kun' ? kunDistractors : onDistractors)
        .filter((m) => m !== correct)
        .slice(0, choicesCount - 1);
      const choices = shuffle([correct, ...distractors]);

      return {
        prompt: item.kanji,
        reading: kind === 'kun' ? 'Scegli la lettura kun' : 'Scegli la lettura on',
        choices,
        correctIndex: choices.indexOf(correct),
        itemId: String(item.numero),
      };
    }

    throw new Error('Non ci sono abbastanza letture o significati distinti per generare il quiz.');
  }

  buildNextWordFillQuestion(items: KanjiItem[], choicesCount = 4, excludeIds: string[] = []): QuizQuestion {
    const withExamples = items.filter((x) => (x.esempi?.length ?? 0) > 0);
    if (withExamples.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} kanji con esempi per fare multiple choice.`);
    }

    const pool = withExamples.filter((x) => !excludeIds.includes(String(x.numero)));
    const pickFrom = pool.length > 0 ? pool : withExamples;

    for (const item of shuffle(pickFrom)) {
      const candidateEsempi = item.esempi.filter((e) => e.parola.includes(item.kanji));
      if (candidateEsempi.length === 0) continue;

      const distractorKanji = shuffle(
        items.filter((x) => x.numero !== item.numero).map((x) => x.kanji)
      ).filter((k, idx, self) => self.indexOf(k) === idx && k !== item.kanji);

      if (distractorKanji.length < choicesCount - 1) continue;

      const esempio = candidateEsempi[Math.floor(Math.random() * candidateEsempi.length)];
      const masked = esempio.parola.split(item.kanji).join('◯');
      const choices = shuffle([item.kanji, ...distractorKanji.slice(0, choicesCount - 1)]);

      return {
        prompt: masked,
        reading: `Scegli il kanji mancante — ${esempio.significato} (${esempio.lettura})`,
        choices,
        correctIndex: choices.indexOf(item.kanji),
        itemId: String(item.numero),
      };
    }

    throw new Error('Non ci sono abbastanza esempi o kanji distinti per generare il quiz.');
  }

  buildNextMeaningToKanjiQuestion(items: KanjiItem[], choicesCount = 4, excludeIds: string[] = []): QuizQuestion {
    if (items.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} kanji per fare multiple choice.`);
    }

    const pool = items.filter((x) => !excludeIds.includes(String(x.numero)));
    const pickFrom = pool.length > 0 ? pool : items;

    for (const item of shuffle(pickFrom)) {
      const distractorKanji = shuffle(
        items.filter((x) => x.numero !== item.numero).map((x) => x.kanji)
      ).filter((k, idx, self) => self.indexOf(k) === idx && k !== item.kanji);

      if (distractorKanji.length < choicesCount - 1) continue;

      const choices = shuffle([item.kanji, ...distractorKanji.slice(0, choicesCount - 1)]);

      return {
        prompt: item.significato.join(', '),
        promptSize: 'md',
        reading: 'Scegli il kanji corrispondente',
        choices,
        correctIndex: choices.indexOf(item.kanji),
        itemId: String(item.numero),
      };
    }

    throw new Error('Non ci sono abbastanza kanji distinti per generare il quiz.');
  }
}
