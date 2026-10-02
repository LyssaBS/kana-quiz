export interface QuizQuestion {
  prompt: string;       // es: 学校
  reading?: string;     // es: がっこう
  choices: string[];    // 4 opzioni IT
  correctIndex: number; // indice in choices
  itemId: string;
}

export interface KanjiEsempio {
  parola: string;
  lettura: string;
  significato: string;
}

export type KanjiLevel = 'N5' | 'N4';

export interface KanjiItem {
  numero: number;
  lezione: number;
  livello: KanjiLevel;
  titolo_lezione?: string;
  kanji: string;
  significato: string[];
  lettura_on: string[];
  lettura_kun: string[];
  esempi: KanjiEsempio[];
}
