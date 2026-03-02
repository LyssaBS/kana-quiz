import { Injectable } from '@angular/core';
import { VocabItem, QuizQuestion, KanaItem, VerbItem, VerbForms, AdjectiveItem, AdjectiveFormKey } from './models';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  buildNextVocabMcQuestion(items: VocabItem[], choicesCount = 4, excludeIds: string[] = []): QuizQuestion {
    if (items.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} vocaboli per fare multiple choice.`);
    }

    const pool = items.filter((x) => !excludeIds.includes(x.id));
    const pickFrom = pool.length > 0 ? pool : items;
    const item = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const correct = item.meaningsIt[0];

    const distractors = shuffle(
      items
        .filter((x) => x.id !== item.id)
        .map((x) => x.meaningsIt[0])
    )
      .filter((m, idx, self) => self.indexOf(m) === idx && m !== correct)
      .slice(0, choicesCount - 1);

    const choices = shuffle([correct, ...distractors]);
    const correctIndex = choices.indexOf(correct);

    return {
      prompt: item.headword,
      reading: item.reading,
      choices,
      correctIndex,
      itemId: item.id,
    };
  }

  private conjAdjective(item: AdjectiveItem, key: AdjectiveFormKey): string {
    if (item.declension) {
      const map: Record<AdjectiveFormKey, string | undefined> = {
        present: item.declension.polite ?? item.declension.plain,
        negative: item.declension.politeNeg ?? item.declension.plainNeg,
        past: item.declension.politePast ?? item.declension.plainPast,
        pastNegative: item.declension.politePastNeg ?? item.declension.plainPastNeg,
        te: item.declension.te,
      };
      if (map[key]) return map[key] as string;
    }
    if (item.type === 'i') {
      const base = item.reading;
      if (!base.endsWith('い')) {
        return base;
      }
      const stem = base.slice(0, -1);
      switch (key) {
        case 'present':
          return base;
        case 'negative':
          return `${stem}くない`;
        case 'past':
          return `${stem}かった`;
        case 'pastNegative':
          return `${stem}くなかった`;
        case 'te':
          return `${stem}くて`;
      }
    } else {
      const base = item.reading;
      switch (key) {
        case 'present':
          return `${base}だ`;
        case 'negative':
          return `${base}じゃない`;
        case 'past':
          return `${base}だった`;
        case 'pastNegative':
          return `${base}じゃなかった`;
        case 'te':
          return `${base}で`;
      }
    }
  }

  buildNextAdjectiveConjugationQuestion(items: AdjectiveItem[], choicesCount = 4, excludeIds: string[] = []): QuizQuestion {
    const pool = items.filter((x) => !excludeIds.includes(x.id));
    const pickFrom = pool.length > 0 ? pool : items;
    if (items.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} aggettivi per fare multiple choice.`);
    }
    const item = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const keys: AdjectiveFormKey[] = ['present', 'negative', 'past', 'pastNegative', 'te'];
    const targetKey = keys[Math.floor(Math.random() * keys.length)];
    const correct = this.conjAdjective(item, targetKey);
    const distractors = shuffle(
      items
        .filter((x) => x.id !== item.id)
        .map((x) => this.conjAdjective(x, targetKey))
    )
      .filter((m): m is string => typeof m === 'string')
      .filter((m, idx, self) => self.indexOf(m) === idx && m !== correct)
      .slice(0, choicesCount - 1);
    const choices = shuffle([correct, ...distractors]);
    const correctIndex = choices.indexOf(correct);
    const labelMap: Record<AdjectiveFormKey, string> = {
      present: 'presente',
      negative: 'presente negativo',
      past: 'passato',
      pastNegative: 'passato negativo',
      te: 'forma て',
    };
    const prompt = `${labelMap[targetKey]} di ${item.headword}`;
    return { prompt, reading: `${item.reading} (${item.meaningsIt[0]})`, choices, correctIndex, itemId: item.id };
  }

  buildNextKanaQuestion(items: KanaItem[], script: 'hira' | 'kata', choicesCount = 5, excludeIds: string[] = []): QuizQuestion {
    const pool = items.filter((x) => !excludeIds.includes(x.id));
    const pickFrom = pool.length > 0 ? pool : items;
    if (pickFrom.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} caratteri kana per fare multiple choice.`);
    }
    const item = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const prompt = script === 'hira' ? item.hira : item.kata;
    const correct = item.id;
    const distractors = shuffle(items.filter((x) => x.id !== item.id).map((x) => x.id))
      .filter((m, idx, self) => self.indexOf(m) === idx && m !== correct)
      .slice(0, choicesCount - 1);
    const choices = shuffle([correct, ...distractors]);
    const correctIndex = choices.indexOf(correct);
    return { prompt, choices, correctIndex, itemId: item.id };
  }

  buildNextVerbMeaningQuestion(items: VerbItem[], choicesCount = 4, excludeIds: string[] = []): QuizQuestion {
    const pool = items.filter((x) => !excludeIds.includes(x.id));
    const pickFrom = pool.length > 0 ? pool : items;
    if (items.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} verbi per fare multiple choice.`);
    }
    const item = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const correct = item.meaningsIt[0];
    const distractors = shuffle(items.filter((x) => x.id !== item.id).map((x) => x.meaningsIt[0]))
      .filter((m, idx, self) => self.indexOf(m) === idx && m !== correct)
      .slice(0, choicesCount - 1);
    const choices = shuffle([correct, ...distractors]);
    const correctIndex = choices.indexOf(correct);
    return { prompt: item.headword, reading: `${item.reading} (${item.meaningsIt[0]})`, choices, correctIndex, itemId: item.id };
  }

  buildNextVerbConjugationQuestion(items: VerbItem[], choicesCount = 4, excludeIds: string[] = []): QuizQuestion {
    const allowedKeys = ['masu','masen','mashita','masenDeshita','te','plain','plainNeg','plainPast','plainPastNeg'];
    const validItems = items.filter((x) => x.forms && Object.keys(x.forms).some((k) => allowedKeys.includes(k)));
    const pool = validItems.filter((x) => !excludeIds.includes(x.id));
    const pickFrom = pool.length > 0 ? pool : validItems;
    if (pickFrom.length < choicesCount) {
      throw new Error(`Servono almeno ${choicesCount} verbi per fare multiple choice.`);
    }
    const item = pickFrom[Math.floor(Math.random() * pickFrom.length)];
    const formKeys = (Object.keys(item.forms!) as (keyof VerbForms)[])
      .filter((k) =>
        ['masu','masen','mashita','masenDeshita','te','plain','plainNeg','plainPast','plainPastNeg'].includes(k as string)
      )
      .filter((k) => !!item.forms![k]);
    if (formKeys.length === 0) {
      throw new Error('Nessuna forma disponibile per il verbo selezionato.');
    }
    const targetKey = formKeys[Math.floor(Math.random() * formKeys.length)];
    const correct = item.forms![targetKey] as string;
    const distractors = shuffle(
      validItems
        .filter((x) => x.id !== item.id)
        .map((x) => x.forms ? x.forms[targetKey] : undefined)
    )
      .filter((m): m is string => typeof m === 'string')
      .filter((m, idx, self) => self.indexOf(m) === idx && m !== correct)
      .slice(0, choicesCount - 1);
    const choices = shuffle([correct, ...distractors]);
    const correctIndex = choices.indexOf(correct);
    const labelMap: Record<keyof VerbForms, string> = {
      masu: 'presente',
      masen: 'presente negativo',
      mashita: 'passato',
      masenDeshita: 'passato negativo',
      te: 'forma て',
      plain: 'presente',
      plainNeg: 'presente negativo',
      plainPast: 'passato',
      plainPastNeg: 'passato negativo',
    };
    const prompt = `${labelMap[targetKey]} di ${item.headword}`;
    return { prompt, reading: `${item.reading} (${item.meaningsIt[0]})`, choices, correctIndex, itemId: item.id };
  }
}
