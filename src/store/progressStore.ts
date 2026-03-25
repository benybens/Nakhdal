import { getSubModulesForModule, getWordIdsForSubModule } from "../domain/modules";
import { wordBank } from "../domain/wordBank";
import type { SessionScope, WordEntry, WordProgress as LearningWordProgress } from "../types/learning";
import { migrateProgress } from "./migration";

const STORAGE_KEY = "nakhdal_user_progress";
const STORAGE_VERSION = 4;

type PersistedProgress = {
  version?: number;
  data?: ProgressStoreState | unknown;
};

export type ProgressStoreState = {
  words: Record<string, LearningWordProgress>;
};

const wordBankById = new Map(wordBank.map((word) => [word.id, word]));

const isProgressStoreState = (value: unknown): value is ProgressStoreState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as ProgressStoreState;
  return typeof candidate.words === "object" && candidate.words !== null;
};

const isLegacyProgress = (value: unknown): boolean => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { modules?: unknown };
  return typeof candidate.modules === "object" && candidate.modules !== null;
};

const getWordsFromIds = (wordIds: string[]): WordEntry[] => {
  const seen = new Set<string>();
  const words: WordEntry[] = [];

  for (const wordId of wordIds) {
    if (seen.has(wordId)) {
      continue;
    }

    const word = wordBankById.get(wordId);
    if (!word) {
      continue;
    }

    seen.add(wordId);
    words.push(word);
  }

  return words;
};

export const createDefaultProgress = (): ProgressStoreState => ({
  words: {},
});

export const loadProgress = (): ProgressStoreState => {
  if (typeof window === "undefined") {
    return createDefaultProgress();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return createDefaultProgress();
  }

  try {
    const parsed = JSON.parse(rawValue) as PersistedProgress | unknown;

    if (isLegacyProgress(parsed)) {
      return { words: migrateProgress(parsed) };
    }

    if (parsed && typeof parsed === "object" && ("version" in parsed || "data" in parsed)) {
      const persisted = parsed as PersistedProgress;
      if (persisted.version === STORAGE_VERSION && isProgressStoreState(persisted.data)) {
        return persisted.data;
      }

      if (isLegacyProgress(persisted.data)) {
        return { words: migrateProgress(persisted.data) };
      }
    }

    return createDefaultProgress();
  } catch {
    return createDefaultProgress();
  }
};

export const saveProgress = (progress: ProgressStoreState) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: STORAGE_VERSION,
      data: progress,
    }),
  );
};

export const clearProgress = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

export const getWordProgress = (progress: ProgressStoreState, wordId: string): LearningWordProgress =>
  progress.words[wordId] ?? {
    word_id: wordId,
    success_count: 0,
    failure_count: 0,
    last_seen: null,
    mastery_level: 0,
  };

export const getWordsByScope = (scope: SessionScope): WordEntry[] => {
  if (scope.type === "global") {
    return [...wordBank];
  }

  if (scope.type === "submodule") {
    return getWordsFromIds(getWordIdsForSubModule(scope.subModuleId));
  }

  return getWordsFromIds(getSubModulesForModule(scope.moduleId).flatMap((subModule) => getWordIdsForSubModule(subModule.id)));
};

export const getWeakWords = (progress: ProgressStoreState): WordEntry[] =>
  Object.values(progress.words)
    .filter((wordProgress) => wordProgress.mastery_level > 0 && wordProgress.mastery_level < 3)
    .sort((left, right) => {
      if (right.failure_count !== left.failure_count) {
        return right.failure_count - left.failure_count;
      }

      if (left.mastery_level !== right.mastery_level) {
        return left.mastery_level - right.mastery_level;
      }

      return left.success_count - right.success_count;
    })
    .map((wordProgress) => wordBankById.get(wordProgress.word_id))
    .filter((word): word is WordEntry => Boolean(word));

export const getMasteredWords = (progress: ProgressStoreState): WordEntry[] =>
  Object.values(progress.words)
    .filter((wordProgress) => wordProgress.mastery_level >= 3)
    .map((wordProgress) => wordBankById.get(wordProgress.word_id))
    .filter((word): word is WordEntry => Boolean(word));

