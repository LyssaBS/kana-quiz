import { Injectable } from '@angular/core';
import { QuizQuestion, KanjiItem, KanjiEsempio } from './models';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type KanjiQuestionType = 'meaning' | 'on' | 'kun' | 'parole';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private formatEsempio(esempio: KanjiEsempio): string {
    return `${esempio.parola} (${esempio.lettura}) - ${esempio.significato}`;
  }

  buildNextKanjiQuestion(
    items: KanjiItem[],
    choicesCount = 4,
    excludeIds: string[] = [],
    allowedTypes: KanjiQuestionType[] = ['meaning', 'kun', 'on', 'parole']
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

      const paroleDistractors = shuffle(
        items
          .filter((x) => x.numero !== item.numero)
          .flatMap((x) => x.esempi ?? [])
          .map((esempio) => this.formatEsempio(esempio))
      ).filter((m, idx, self) => self.indexOf(m) === idx);

      if (
        allowedTypes.includes('parole') &&
        (item.esempi?.length ?? 0) > 0 &&
        paroleDistractors.length >= choicesCount - 1
      ) {
        validKinds.push('parole');
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

      if (kind === 'parole') {
        const esempio = item.esempi[Math.floor(Math.random() * item.esempi.length)];
        const correct = this.formatEsempio(esempio);
        const distractors = paroleDistractors.filter((m) => m !== correct).slice(0, choicesCount - 1);
        const choices = shuffle([correct, ...distractors]);
        return {
          prompt: item.kanji,
          reading: 'Scegli una parola che usa questo kanji',
          choices,
          correctIndex: choices.indexOf(correct),
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

    throw new Error('Non ci sono abbastanza letture, significati o parole distinti per generare il quiz.');
  }
}
