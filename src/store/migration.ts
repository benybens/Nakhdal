import { wordBank } from "../domain/wordBank";
import type { VocabularyWord } from "../types";
import type { WordProgress } from "../types/learning";

type LegacyWordProgress = {
  successCount: number;
  exposed: boolean;
  mastered: boolean;
};

type LegacyModuleProgress = {
  wordStats: Record<string, LegacyWordProgress>;
  completed: boolean;
};

type LegacyVocabularyWord = VocabularyWord;

type LegacyUserProgress = {
  modules: Record<string, LegacyModuleProgress>;
  revisionWords?: LegacyVocabularyWord[];
};

type MigratedProgress = Record<string, WordProgress>;

type NormalizeResult = {
  darja: string;
  translation: string;
  key: string;
};

const normalizeText = (value: string) => value.trim().toLowerCase();

const hash = (value: string) => {
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b1;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193) >>> 0;
    hashB ^= code;
    hashB = Math.imul(hashB, 0x85ebca6b) >>> 0;
  }
  return `${hashA.toString(16).padStart(8, "0")}${hashB.toString(16).padStart(8, "0")}`;
};

export const normalize = (dz: string, fr: string): NormalizeResult => {
  const darja = normalizeText(dz);
  const translation = normalizeText(fr);
  return { darja, translation, key: `${darja}|${translation}` };
};

export const generateWordId = (dz: string, fr: string): string => hash(normalize(dz, fr).key);

const bankWordIdByKey = new Map(wordBank.map((word) => [normalize(word.dz, word.fr).key, word.id]));
const bankTranslationByDarja = new Map<string, string>();
for (const word of wordBank) {
  const normalizedDarja = normalizeText(word.dz);
  if (!bankTranslationByDarja.has(normalizedDarja)) {
    bankTranslationByDarja.set(normalizedDarja, word.fr);
  }
}

const buildRevisionWordMap = (revisionWords: LegacyVocabularyWord[] = []) => {
  const map = new Map<string, string>();
  for (const word of revisionWords) {
    const normalizedDarja = normalizeText(word.dz);
    if (!normalizedDarja || map.has(normalizedDarja)) continue;
    map.set(normalizedDarja, word.fr);
  }
  return map;
};

const resolveLegacyTranslation = (dz: string, revisionWordMap: Map<string, string>): string | null => {
  const normalizedDarja = normalizeText(dz);
  return revisionWordMap.get(normalizedDarja) ?? bankTranslationByDarja.get(normalizedDarja) ?? null;
};

const toMasteryLevel = (legacyProgress: LegacyWordProgress): 0 | 1 | 2 | 3 => {
  if (legacyProgress.mastered) return 3;
  if (legacyProgress.successCount > 0) return 2;
  if (legacyProgress.exposed) return 1;
  return 0;
};

const createMigratedWordProgress = (wordId: string, successCount: number, masteryLevel: 0 | 1 | 2 | 3): WordProgress => ({
  word_id: wordId,
  success_count: successCount,
  failure_count: 0,
  last_seen: 0 as unknown as WordProgress["last_seen"],
  mastery_level: masteryLevel,
});

export const migrateProgress = (oldProgress: LegacyUserProgress): MigratedProgress => {
  const migratedProgress: MigratedProgress = {};
  const revisionWordMap = buildRevisionWordMap(oldProgress.revisionWords);

  for (const moduleProgress of Object.values(oldProgress.modules)) {
    for (const [legacyDz, legacyWordProgress] of Object.entries(moduleProgress.wordStats)) {
      const translation = resolveLegacyTranslation(legacyDz, revisionWordMap);
      if (!translation) continue;
      const normalizedWord = normalize(legacyDz, translation);
      const wordId = bankWordIdByKey.get(normalizedWord.key) ?? generateWordId(normalizedWord.darja, normalizedWord.translation);
      const masteryLevel = toMasteryLevel(legacyWordProgress);
      const existingProgress = migratedProgress[wordId];
      const successCount = Math.max(existingProgress?.success_count ?? 0, legacyWordProgress.successCount);
      const resolvedMasteryLevel = Math.max(existingProgress?.mastery_level ?? 0, masteryLevel) as 0 | 1 | 2 | 3;
      migratedProgress[wordId] = createMigratedWordProgress(wordId, successCount, resolvedMasteryLevel);
    }
  }

  return migratedProgress;
};

