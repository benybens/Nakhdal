import {
  AnswerResult,
  TrainerWordState,
  UserProgress,
  VocabularyModule,
  VocabularyWord,
  WordProgress,
} from "../types";
import {
  getModuleProgress,
  getWordProgress,
} from "../store/progressStore";

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

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
};

const areSameWord = (left: VocabularyWord, right: VocabularyWord) => left.dz === right.dz && left.fr === right.fr;

const pickPreferredWord = (candidates: VocabularyWord[], previousWord?: VocabularyWord | null) => {
  if (candidates.length === 0) {
    return null;
  }

  if (!previousWord) {
    return shuffle(candidates)[0];
  }

  const differentWords = candidates.filter((candidate) => !areSameWord(candidate, previousWord));
  const pool = differentWords.length > 0 ? differentWords : candidates;
  return shuffle(pool)[0];
};

const scoreCandidate = (expectedAnswer: string, candidateAnswer: string) => {
  const expected = normalizeAnswer(expectedAnswer);
  const candidate = normalizeAnswer(candidateAnswer);

  const distance = getEditDistance(expected, candidate);
  const lengthDelta = Math.abs(expected.length - candidate.length);

  return distance + lengthDelta * 0.25;
};

export const getNextWord = (
  module: VocabularyModule,
  progress: UserProgress,
  previousWord?: VocabularyWord | null,
): TrainerWordState | null => {
  const availableWords = module.words.filter((word) => {
    const wordProgress = getWordProgress(progress, module.id, word);
    return !wordProgress.mastered;
  });

  const word = pickPreferredWord(availableWords, previousWord);
  if (!word) {
    return null;
  }

  const wordProgress = getWordProgress(progress, module.id, word);
  const attemptType = wordProgress.exposed ? "question" : "exposure";

  return {
    word,
    attemptType,
    progress: wordProgress,
  };
};

export const submitAnswer = (
  word: VocabularyWord,
  answer: string,
  currentProgress: WordProgress,
): AnswerResult => {
  const isCorrect = isAcceptedAnswer(answer, word.fr);
  const nextSuccessCount = isCorrect
    ? currentProgress.successCount + 1
    : currentProgress.successCount;

  return {
    isCorrect,
    correctAnswer: word.fr,
    updatedProgress: {
      exposed: true,
      successCount: nextSuccessCount,
      mastered: nextSuccessCount >= 2,
    },
  };
};

export const getQuestionOptions = (
  word: VocabularyWord,
  pool: VocabularyWord[],
  totalOptions = 4,
): string[] => {
  const correctAnswer = word.fr;
  const correctVariants = new Set(getAnswerVariants(correctAnswer));

  const distractors = pool
    .filter((candidate) => candidate.dz !== word.dz)
    .filter((candidate) => {
      const candidateVariants = getAnswerVariants(candidate.fr);
      return !candidateVariants.some((variant) => correctVariants.has(variant));
    })
    .sort((left, right) => (
      scoreCandidate(correctAnswer, left.fr) - scoreCandidate(correctAnswer, right.fr)
    ));

  const uniqueDistractors: string[] = [];
  const seen = new Set<string>();

  for (const candidate of distractors) {
    const key = normalizeAnswer(candidate.fr);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueDistractors.push(candidate.fr);

    if (uniqueDistractors.length === totalOptions - 1) {
      break;
    }
  }

  return shuffle([correctAnswer, ...uniqueDistractors]);
};

export const markExposureComplete = (currentProgress: WordProgress): WordProgress => ({
  ...currentProgress,
  exposed: true,
});

export const isModuleCompleted = (
  module: VocabularyModule,
  progress: UserProgress,
): boolean => {
  const moduleProgress = getModuleProgress(progress, module);

  if (moduleProgress.completed) {
    return true;
  }

  return module.words.every((word) => {
    const wordProgress = getWordProgress(progress, module.id, word);
    return wordProgress.mastered;
  });
};

export const getModuleMasteredCount = (
  module: VocabularyModule,
  progress: UserProgress,
) => {
  return module.words.filter((word) => {
    const wordProgress = getWordProgress(progress, module.id, word);
    return wordProgress.mastered;
  }).length;
};

export const getRandomRevisionWord = (
  progress: UserProgress,
  previousWord?: VocabularyWord | null,
): VocabularyWord | null => {
  return pickPreferredWord(progress.revisionWords, previousWord);
};
