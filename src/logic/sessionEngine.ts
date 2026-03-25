import { wordBank } from "../domain/wordBank";
import { getRankedCandidates, weightedPick } from "./scheduler";
import type { SessionItem, SessionScope, WordProgress } from "../types/learning";

type ProgressMap = Record<string, WordProgress>;

type SubmittedAnswer = {
  value?: string;
  self_assessed_correct?: boolean;
};

type AnswerEvaluation = {
  word_id: string;
  mode: SessionItem["mode"];
  is_correct: boolean;
  expected_answer: string;
  submitted_answer: string | null;
};

type RetryQueueEntry = {
  wordId: string;
  cooldown: number;
};

export type LearningSessionState = {
  currentItem: SessionItem | null;
  queuedWordIds: string[];
  retryQueue: RetryQueueEntry[];
  retryCounts: Record<string, number>;
  answeredCount: number;
  totalPlanned: number;
};

const MAX_RETRIES_PER_SESSION = 2;
const SESSION_VARIATION_FACTOR = 0.05;
const MCQ_OPTIONS_COUNT = 4;

const wordBankById = new Map(wordBank.map((word) => [word.id, word]));

const normalizeAnswer = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

const stripLeadingArticle = (value: string) =>
  value.replace(/^(l'|le |la |les |un |une |des |du |de la |de l')/i, "").trim();

const getAnswerVariants = (value: string) => {
  const normalizedValue = normalizeAnswer(value);
  const withoutArticle = stripLeadingArticle(normalizedValue);
  return Array.from(new Set([normalizedValue, withoutArticle].filter(Boolean)));
};

const getEditDistance = (source: string, target: string) => {
  const rows = source.length + 1;
  const columns = target.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = source[row - 1] === target[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[source.length][target.length];
};

const scoreCandidate = (expectedAnswer: string, candidateAnswer: string) => {
  const expected = normalizeAnswer(expectedAnswer);
  const candidate = normalizeAnswer(candidateAnswer);
  const distance = getEditDistance(expected, candidate);
  const lengthDelta = Math.abs(expected.length - candidate.length);
  return distance + lengthDelta * 0.25;
};

const buildMcqOptions = (wordId: string): string[] => {
  const word = wordBankById.get(wordId);

  if (!word) {
    return [];
  }

  const correctAnswer = word.fr;
  const correctVariants = new Set(getAnswerVariants(correctAnswer));

  const distractors = wordBank
    .filter((candidate) => candidate.id !== word.id)
    .filter((candidate) => {
      const candidateVariants = getAnswerVariants(candidate.fr);
      return !candidateVariants.some((variant) => correctVariants.has(variant));
    })
    .sort((left, right) => scoreCandidate(correctAnswer, left.fr) - scoreCandidate(correctAnswer, right.fr));

  const uniqueDistractors: string[] = [];
  const seen = new Set<string>();
  for (const candidate of distractors) {
    const key = normalizeAnswer(candidate.fr);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueDistractors.push(candidate.fr);
    if (uniqueDistractors.length === MCQ_OPTIONS_COUNT - 1) {
      break;
    }
  }

  const options = [correctAnswer, ...uniqueDistractors];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
  }

  return options;
};

const isAcceptedAnswer = (answer: string, expectedAnswer: string) => {
  const answerVariants = getAnswerVariants(answer);
  const expectedVariants = getAnswerVariants(expectedAnswer);

  for (const answerVariant of answerVariants) {
    for (const expectedVariant of expectedVariants) {
      if (answerVariant === expectedVariant) {
        return true;
      }

      if (getEditDistance(answerVariant, expectedVariant) <= 1) {
        return true;
      }
    }
  }

  return false;
};

const getCurrentProgress = (progressByWordId: ProgressMap, wordId: string): WordProgress =>
  progressByWordId[wordId] ?? {
    word_id: wordId,
    success_count: 0,
    failure_count: 0,
    last_seen: null,
    mastery_level: 0,
  };

const getMasteryLevelFromSuccessCount = (successCount: number): 0 | 1 | 2 | 3 => {
  if (successCount >= 2) {
    return 3;
  }

  if (successCount === 1) {
    return 2;
  }

  return 1;
};

const getDifficulty = (progress: WordProgress): number => {
  const weakness = 3 - progress.mastery_level;
  const failurePressure = Math.min(2, progress.failure_count);
  return Math.max(1, Math.min(5, weakness + failurePressure));
};

const buildSessionItem = (
  wordId: string,
  progressByWordId: ProgressMap,
): SessionItem => {
  const progress = getCurrentProgress(progressByWordId, wordId);
  const mode = chooseMode(progress);

  return {
    word_id: wordId,
    mode,
    difficulty: getDifficulty(progress),
    options: mode === "mcq" ? buildMcqOptions(wordId) : [],
  } satisfies SessionItem;
};

const ageRetryQueue = (retryQueue: RetryQueueEntry[]): RetryQueueEntry[] =>
  retryQueue.map((entry) => ({
    ...entry,
    cooldown: Math.max(0, entry.cooldown - 1),
  }));

const seedNoise = (value: string, seed: number): number => {
  let hash = seed >>> 0;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash / 0xffffffff;
};

const sampleWordIds = (
  scope: SessionScope,
  size: number,
  progressByWordId: ProgressMap,
  now: number,
): string[] => {
  const rankedCandidates = getRankedCandidates(scope, progressByWordId, now)
    .map((candidate) => ({
      ...candidate,
      priority: candidate.priority + seedNoise(candidate.word_id, now) * SESSION_VARIATION_FACTOR,
    }))
    .sort((left, right) => {
      if (left.bucket !== right.bucket) {
        return 0;
      }

      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return left.word_id.localeCompare(right.word_id);
    });

  return weightedPick(rankedCandidates, Math.max(0, size));
};

const pickNextWordId = (state: LearningSessionState): {
  wordId: string | null;
  queuedWordIds: string[];
  retryQueue: RetryQueueEntry[];
} => {
  const readyRetryIndex = state.retryQueue.findIndex((entry) => entry.cooldown <= 0);

  if (readyRetryIndex >= 0) {
    const readyRetry = state.retryQueue[readyRetryIndex];
    return {
      wordId: readyRetry.wordId,
      queuedWordIds: state.queuedWordIds,
      retryQueue: state.retryQueue.filter((_, index) => index !== readyRetryIndex),
    };
  }

  if (state.queuedWordIds.length > 0) {
    const [wordId, ...rest] = state.queuedWordIds;
    return {
      wordId,
      queuedWordIds: rest,
      retryQueue: state.retryQueue,
    };
  }

  if (state.retryQueue.length > 0) {
    const [retryEntry, ...rest] = state.retryQueue;
    return {
      wordId: retryEntry.wordId,
      queuedWordIds: state.queuedWordIds,
      retryQueue: rest,
    };
  }

  return {
    wordId: null,
    queuedWordIds: state.queuedWordIds,
    retryQueue: state.retryQueue,
  };
};

const primeSessionState = (
  state: LearningSessionState,
  progressByWordId: ProgressMap,
): LearningSessionState => {
  if (state.currentItem) {
    return state;
  }

  const nextSelection = pickNextWordId(state);

  return {
    ...state,
    queuedWordIds: nextSelection.queuedWordIds,
    retryQueue: nextSelection.retryQueue,
    currentItem: nextSelection.wordId ? buildSessionItem(nextSelection.wordId, progressByWordId) : null,
  };
};

export const chooseMode = (wordProgress?: WordProgress): SessionItem["mode"] => {
  if (!wordProgress || wordProgress.mastery_level <= 1) {
    return "mcq";
  }

  if (wordProgress.failure_count >= wordProgress.success_count) {
    return "mcq";
  }

  return "recall";
};

export const generateSession = (
  scope: SessionScope,
  size: number,
  progressByWordId: ProgressMap = {},
  now = Date.now(),
): SessionItem[] => {
  const sampledWordIds = sampleWordIds(scope, size, progressByWordId, now);

  return sampledWordIds.map((wordId) => buildSessionItem(wordId, progressByWordId));
};

export const createSessionState = (
  scope: SessionScope,
  size: number,
  progressByWordId: ProgressMap = {},
  now = Date.now(),
): LearningSessionState => {
  const queuedWordIds = sampleWordIds(scope, size, progressByWordId, now);

  return primeSessionState(
    {
      currentItem: null,
      queuedWordIds,
      retryQueue: [],
      retryCounts: {},
      answeredCount: 0,
      totalPlanned: queuedWordIds.length,
    },
    progressByWordId,
  );
};

export const getCurrentSessionItem = (session: LearningSessionState): SessionItem | null => session.currentItem;

export const evaluateAnswer = (
  sessionItem: SessionItem,
  answer: SubmittedAnswer,
): AnswerEvaluation => {
  const word = wordBankById.get(sessionItem.word_id);

  if (!word) {
    throw new Error(`Unknown word for session item: ${sessionItem.word_id}`);
  }

  const submittedAnswer = answer.value?.trim() || null;
  const isCorrect = typeof answer.self_assessed_correct === "boolean"
    ? answer.self_assessed_correct
    : isAcceptedAnswer(submittedAnswer ?? "", word.fr);

  return {
    word_id: sessionItem.word_id,
    mode: sessionItem.mode,
    is_correct: isCorrect,
    expected_answer: word.fr,
    submitted_answer: submittedAnswer,
  };
};

export const applyAnswerResult = (
  progressByWordId: ProgressMap,
  evaluation: AnswerEvaluation,
  now = Date.now(),
): ProgressMap => {
  const currentProgress = getCurrentProgress(progressByWordId, evaluation.word_id);
  const nextProgress: WordProgress = evaluation.is_correct
    ? {
        ...currentProgress,
        word_id: evaluation.word_id,
        success_count: currentProgress.success_count + 1,
        last_seen: new Date(now).toISOString(),
        mastery_level: getMasteryLevelFromSuccessCount(currentProgress.success_count + 1),
      }
    : {
        ...currentProgress,
        word_id: evaluation.word_id,
        failure_count: currentProgress.failure_count + 1,
        last_seen: new Date(now).toISOString(),
        mastery_level: Math.max(0, currentProgress.mastery_level - (currentProgress.mastery_level >= 3 ? 1 : 0)) as 0 | 1 | 2 | 3,
      };

  return {
    ...progressByWordId,
    [evaluation.word_id]: nextProgress,
  };
};

export const advanceSession = (
  session: LearningSessionState,
  progressByWordId: ProgressMap,
  evaluation: AnswerEvaluation,
  now = Date.now(),
): {
  progress: ProgressMap;
  session: LearningSessionState;
} => {
  const nextProgress = applyAnswerResult(progressByWordId, evaluation, now);
  const retryQueue = ageRetryQueue(session.retryQueue);
  const retryCounts = { ...session.retryCounts };
  const currentRetryCount = retryCounts[evaluation.word_id] ?? 0;

  if (!evaluation.is_correct && currentRetryCount < MAX_RETRIES_PER_SESSION) {
    retryCounts[evaluation.word_id] = currentRetryCount + 1;
    retryQueue.push({
      wordId: evaluation.word_id,
      cooldown: session.queuedWordIds.length > 0 || retryQueue.length > 0 ? 1 : 0,
    });
  }

  const nextState = primeSessionState(
    {
      ...session,
      currentItem: null,
      retryQueue,
      retryCounts,
      answeredCount: session.answeredCount + 1,
    },
    nextProgress,
  );

  return {
    progress: nextProgress,
    session: nextState,
  };
};
