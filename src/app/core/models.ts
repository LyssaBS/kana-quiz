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

export interface KanjiItem {
  numero: number;
  lezione: number;
  kanji: string;
  significato: string[];
  lettura_on: string[];
  lettura_kun: string[];
  esempi: KanjiEsempio[];
}
