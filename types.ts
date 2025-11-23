export enum VocabularyLevel {
  CET6 = 'CET-6 (六级)',
  KAOYAN = 'Postgraduate Exam (考研)'
}

export interface WordItem {
  word: string;
  phonetic: string;
  meanings: string[];
  example: string;
  exampleTranslation: string;
}

export interface QuizState {
  currentWordIndex: number;
  words: WordItem[];
  score: number;
  totalAnswered: number;
  streak: number;
  isFinished: boolean;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  READY = 'READY'
}

export interface CheckResult {
  isCorrect: boolean;
  userAnswer: string;
  explanation?: string;
}