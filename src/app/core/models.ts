export type QuizMode = 'vocab-mc' | 'kana-hira' | 'kana-kata' | 'verb-meaning' | 'verb-conj';

export interface VocabItem {
  id: string;
  pos: string;
  level: string;
  lesson?: number;
  headword: string;
  reading: string;      // kana (furigana)
  meaningsIt: string[]; // accettiamo sinonimi
}

export interface QuizQuestion {
  prompt: string;       // es: 学校
  reading?: string;     // es: がっこう
  choices: string[];    // 4 opzioni IT
  correctIndex: number; // indice in choices
  itemId: string;
}

export interface KanaItem {
  id: string;
  hira: string;
  kata: string;
}

export interface VerbForms {
  masu: string;
  masen: string;
  mashita: string;
  masenDeshita: string;
  te: string;
  plain?: string;
  plainNeg?: string;
  plainPast?: string;
  plainPastNeg?: string;
}

export interface VerbItem {
  id: string;
  pos: string;
  level: string;
  headword: string;
  reading: string;
  meaningsIt: string[];
  forms: VerbForms;
}

export type AdjectiveType = 'i' | 'na';
export type AdjectiveFormKey = 'present' | 'negative' | 'past' | 'pastNegative' | 'te';

export interface AdjectiveItem {
  id: string;
  level: string;
  lesson?: number;
  type: AdjectiveType;
  headword: string;
  reading: string;
  meaningsIt: string[];
  declension?: {
    plain?: string;
    plainNeg?: string;
    plainPast?: string;
    plainPastNeg?: string;
    polite?: string;
    politeNeg?: string;
    politePast?: string;
    politePastNeg?: string;
    te?: string;
  };
}
