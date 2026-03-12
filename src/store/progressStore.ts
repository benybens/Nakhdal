import { UserProgress, VocabularyModule, VocabularyWord, WordProgress } from "../types";

const STORAGE_KEY = "nakhdal_user_progress";

const createEmptyWordProgress = (): WordProgress => ({
  successCount: 0,
  exposed: false,
  mastered: false,
});

const createDefaultProgress = (): UserProgress => ({
  modules: {},
  revisionWords: [],
});

export const getWordKey = (word: VocabularyWord) => word.dz;

export const loadProgress = (): UserProgress => {
  if (typeof window === "undefined") {
    return createDefaultProgress();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return createDefaultProgress();
  }

  try {
    return JSON.parse(rawValue) as UserProgress;
  } catch {
    return createDefaultProgress();
  }
};

export const saveProgress = (progress: UserProgress) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const getModuleProgress = (
  progress: UserProgress,
  module: VocabularyModule,
) => {
  return (
    progress.modules[module.id] ?? {
      wordStats: {},
      completed: false,
    }
  );
};

export const getWordProgress = (
  progress: UserProgress,
  moduleId: string,
  word: VocabularyWord,
): WordProgress => {
  return (
    progress.modules[moduleId]?.wordStats[getWordKey(word)] ?? createEmptyWordProgress()
  );
};

export const updateWordProgress = (
  progress: UserProgress,
  moduleId: string,
  word: VocabularyWord,
  wordProgress: WordProgress,
): UserProgress => {
  const moduleProgress = progress.modules[moduleId] ?? {
    wordStats: {},
    completed: false,
  };

  return {
    ...progress,
    modules: {
      ...progress.modules,
      [moduleId]: {
        ...moduleProgress,
        wordStats: {
          ...moduleProgress.wordStats,
          [getWordKey(word)]: wordProgress,
        },
      },
    },
  };
};

export const markModuleCompleted = (
  progress: UserProgress,
  module: VocabularyModule,
): UserProgress => {
  const existingModuleProgress = getModuleProgress(progress, module);
  const nextRevisionWords = [...progress.revisionWords];

  for (const word of module.words) {
    const alreadyAdded = nextRevisionWords.some(
      (revisionWord) => revisionWord.dz === word.dz,
    );

    if (!alreadyAdded) {
      nextRevisionWords.push(word);
    }
  }

  return {
    ...progress,
    modules: {
      ...progress.modules,
      [module.id]: {
        ...existingModuleProgress,
        completed: true,
      },
    },
    revisionWords: nextRevisionWords,
  };
};
