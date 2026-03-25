import type { VocabularyWord } from "../types";

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

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let column = 0; column < columns; column += 1) matrix[0][column] = column;

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
    .sort((left, right) => scoreCandidate(correctAnswer, left.fr) - scoreCandidate(correctAnswer, right.fr));

  const uniqueDistractors: string[] = [];
  const seen = new Set<string>();
  for (const candidate of distractors) {
    const key = normalizeAnswer(candidate.fr);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueDistractors.push(candidate.fr);
    if (uniqueDistractors.length === totalOptions - 1) break;
  }

  const options = [correctAnswer, ...uniqueDistractors];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
  }

  return options;
};
