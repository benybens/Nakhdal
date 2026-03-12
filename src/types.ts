export type VocabularyWord = {
  dz: string;
  fr: string;
};

export type VocabularyModule = {
  id: string;
  title: string;
  words: VocabularyWord[];
};

export type WordProgress = {
  successCount: number;
  exposed: boolean;
  mastered: boolean;
};

export type ModuleProgress = {
  wordStats: Record<string, WordProgress>;
  completed: boolean;
};

export type UserProgress = {
  modules: Record<string, ModuleProgress>;
  revisionWords: VocabularyWord[];
};

export type TrainerWordState = {
  word: VocabularyWord;
  attemptType: "exposure" | "question";
  progress: WordProgress;
};

export type AnswerResult = {
  isCorrect: boolean;
  correctAnswer: string;
  updatedProgress: WordProgress;
};
