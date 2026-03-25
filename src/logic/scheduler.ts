import { getSubModulesForModule, getWordIdsForSubModule } from "../domain/modules";
import { wordBank } from "../domain/wordBank";
import type { SessionScope, WordEntry, WordProgress } from "../types/learning";

type ProgressMap = Record<string, WordProgress>;
type CandidateBucket = "weak" | "new" | "mastered";

type RankedCandidate = {
  word_id: string;
  priority: number;
  bucket: CandidateBucket;
};

const DEFAULT_BUCKET_WEIGHTS: Record<CandidateBucket, number> = {
  weak: 0.5,
  new: 0.3,
  mastered: 0.2,
};

const wordBankById = new Map(wordBank.map((word) => [word.id, word]));

const getBucket = (progress?: WordProgress): CandidateBucket => {
  if (!progress || progress.mastery_level === 0) {
    return "new";
  }

  if (progress.mastery_level >= 3) {
    return "mastered";
  }

  return "weak";
};

const toTimestamp = (lastSeen: WordProgress["last_seen"] | number | null): number | null => {
  if (typeof lastSeen === "number") {
    return Number.isFinite(lastSeen) ? lastSeen : null;
  }

  if (typeof lastSeen === "string") {
    const parsed = Date.parse(lastSeen);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const recencyBoost = (
  lastSeen: WordProgress["last_seen"] | number | null,
  now = Date.now(),
): number => {
  const timestamp = toTimestamp(lastSeen);

  if (timestamp === null) {
    return 1;
  }

  const elapsedMs = Math.max(0, now - timestamp);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  return Math.min(1, elapsedHours / 72);
};

export const computePriority = (
  word: WordEntry,
  progress?: WordProgress,
  now = Date.now(),
): number => {
  const masteryPenalty = progress ? progress.mastery_level / 3 : 0;
  const weaknessFactor = 1 - masteryPenalty;
  const failureFactor = Math.min(1, (progress?.failure_count ?? 0) / 5);
  const frequencyFactor = Math.max(0, Math.min(1, word.frequencyScore));
  const recencyFactor = recencyBoost(progress?.last_seen ?? null, now);

  return (
    weaknessFactor * 0.4 +
    failureFactor * 0.25 +
    frequencyFactor * 0.2 +
    recencyFactor * 0.15
  );
};

const getScopeWordIds = (scope: SessionScope): string[] => {
  if (scope.type === "global") {
    return wordBank.map((word) => word.id);
  }

  if (scope.type === "submodule") {
    return getWordIdsForSubModule(scope.subModuleId);
  }

  return getSubModulesForModule(scope.moduleId).flatMap((subModule) => getWordIdsForSubModule(subModule.id));
};

const rankBucket = (
  wordIds: string[],
  progressByWordId: ProgressMap,
  now: number,
  bucket: CandidateBucket,
): RankedCandidate[] => {
  return wordIds
    .map((wordId) => {
      const word = wordBankById.get(wordId);

      if (!word) {
        return null;
      }

      return {
        word_id: wordId,
        bucket,
        priority: computePriority(word, progressByWordId[wordId], now),
      } satisfies RankedCandidate;
    })
    .filter((candidate): candidate is RankedCandidate => candidate !== null)
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return left.word_id.localeCompare(right.word_id);
    });
};

const allocateBucketCounts = (
  total: number,
  available: Record<CandidateBucket, number>,
  weights: Record<CandidateBucket, number>,
): Record<CandidateBucket, number> => {
  const counts: Record<CandidateBucket, number> = {
    weak: 0,
    new: 0,
    mastered: 0,
  };

  const desired: Record<CandidateBucket, number> = {
    weak: total * weights.weak,
    new: total * weights.new,
    mastered: total * weights.mastered,
  };

  for (const bucket of Object.keys(counts) as CandidateBucket[]) {
    counts[bucket] = Math.min(available[bucket], Math.floor(desired[bucket]));
  }

  let assigned = counts.weak + counts.new + counts.mastered;
  const bucketsByRemainder = (Object.keys(counts) as CandidateBucket[])
    .map((bucket) => ({
      bucket,
      remainder: desired[bucket] - Math.floor(desired[bucket]),
    }))
    .sort((left, right) => right.remainder - left.remainder);

  while (assigned < total) {
    let filled = false;

    for (const { bucket } of bucketsByRemainder) {
      if (counts[bucket] >= available[bucket]) {
        continue;
      }

      counts[bucket] += 1;
      assigned += 1;
      filled = true;

      if (assigned >= total) {
        break;
      }
    }

    if (!filled) {
      break;
    }
  }

  return counts;
};

export const weightedPick = (
  candidates: RankedCandidate[],
  totalCount = candidates.length,
  weights: Record<CandidateBucket, number> = DEFAULT_BUCKET_WEIGHTS,
): string[] => {
  const buckets: Record<CandidateBucket, RankedCandidate[]> = {
    weak: candidates.filter((candidate) => candidate.bucket === "weak"),
    new: candidates.filter((candidate) => candidate.bucket === "new"),
    mastered: candidates.filter((candidate) => candidate.bucket === "mastered"),
  };

  const limitedTotal = Math.max(0, Math.min(totalCount, candidates.length));
  const bucketCounts = allocateBucketCounts(
    limitedTotal,
    {
      weak: buckets.weak.length,
      new: buckets.new.length,
      mastered: buckets.mastered.length,
    },
    weights,
  );

  const picked: string[] = [];

  for (const bucket of ["weak", "new", "mastered"] as CandidateBucket[]) {
    picked.push(...buckets[bucket].slice(0, bucketCounts[bucket]).map((candidate) => candidate.word_id));
  }

  if (picked.length < limitedTotal) {
    const remaining = candidates
      .filter((candidate) => !picked.includes(candidate.word_id))
      .map((candidate) => candidate.word_id);

    picked.push(...remaining.slice(0, limitedTotal - picked.length));
  }

  return picked;
};

export const selectCandidates = (
  scope: SessionScope,
  progressByWordId: ProgressMap = {},
  now = Date.now(),
): string[] => {
  const scopedWordIds = Array.from(new Set(getScopeWordIds(scope)));
  const bucketedWordIds: Record<CandidateBucket, string[]> = {
    weak: [],
    new: [],
    mastered: [],
  };

  for (const wordId of scopedWordIds) {
    const bucket = getBucket(progressByWordId[wordId]);
    bucketedWordIds[bucket].push(wordId);
  }

  const rankedCandidates = [
    ...rankBucket(bucketedWordIds.weak, progressByWordId, now, "weak"),
    ...rankBucket(bucketedWordIds.new, progressByWordId, now, "new"),
    ...rankBucket(bucketedWordIds.mastered, progressByWordId, now, "mastered"),
  ];

  return weightedPick(rankedCandidates, rankedCandidates.length);
};

export const getRankedCandidates = (
  scope: SessionScope,
  progressByWordId: ProgressMap = {},
  now = Date.now(),
): RankedCandidate[] => {
  const rankedWordIds = selectCandidates(scope, progressByWordId, now);

  return rankedWordIds
    .map((wordId) => {
      const word = wordBankById.get(wordId);

      if (!word) {
        return null;
      }

      return {
        word_id: wordId,
        priority: computePriority(word, progressByWordId[wordId], now),
        bucket: getBucket(progressByWordId[wordId]),
      } satisfies RankedCandidate;
    })
    .filter((candidate): candidate is RankedCandidate => candidate !== null);
};



