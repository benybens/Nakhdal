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

export const getNextWord = (
  module: VocabularyModule,
  progress: UserProgress,
): TrainerWordState | null => {
  const availableWords = shuffle(module.words);

  for (const word of availableWords) {
    const wordProgress = getWordProgress(progress, module.id, word);

    if (wordProgress.mastered) {
      continue;
    }

    const attemptType = wordProgress.exposed ? "question" : "exposure";

    return {
      word,
      attemptType,
      progress: wordProgress,
    };
  }

  return null;
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
): VocabularyWord | null => {
  if (progress.revisionWords.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * progress.revisionWords.length);
  return progress.revisionWords[randomIndex];
};
