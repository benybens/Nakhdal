import lesson02PresentationVocab from "./json/lesson_02_presentation_vocab.json";
import lesson03Pronouns from "./json/lesson_03_pronouns.json";
import lesson03Vocab from "./json/lesson_03_vocab.json";
import lesson04Demonstratives from "./json/lesson_04_demonstratives.json";
import lesson04Vocab from "./json/lesson_04_vocab.json";
import lesson05KeyExpressions from "./json/lesson_05_key_expressions.json";
import lesson05VideoVocab from "./json/lesson_05_video_vocab.json";
import lesson06Possessive from "./json/lesson_06_possessive.json";
import lesson06Vocab from "./json/lesson_06_vocab.json";
import lesson07NatureVocab from "./json/lesson_07_nature_vocab.json";
import lesson08KeyExpressions from "./json/lesson_08_key_expressions.json";
import pronunciationLetters from "./json/pronunciation_letters.json";
import { VocabularyModule, VocabularyWord } from "../types";

const sourceModules: VocabularyModule[] = [
  pronunciationLetters,
  lesson02PresentationVocab,
  lesson03Pronouns,
  lesson03Vocab,
  lesson04Demonstratives,
  lesson04Vocab,
  lesson05KeyExpressions,
  lesson05VideoVocab,
  lesson06Possessive,
  lesson06Vocab,
  lesson07NatureVocab,
  lesson08KeyExpressions,
] as VocabularyModule[];

const MIN_WORDS_PER_MODULE = 3;
const MAX_WORDS_PER_MODULE = 15;

const normalizeWordKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[?.!;:,]+|[?.!;:,]+$/g, "");

const isSinglePromptTerm = (value: string) => /^[^\s]+$/.test(normalizeWordKey(value));

const wordIndex = new Map<string, VocabularyWord>();

for (const module of sourceModules) {
  for (const word of module.words) {
    if (!isSinglePromptTerm(word.dz)) {
      continue;
    }

    const key = normalizeWordKey(word.dz);
    if (!wordIndex.has(key)) {
      wordIndex.set(key, word);
    }
  }
}

const pickWord = (dz: string): VocabularyWord => {
  const word = wordIndex.get(normalizeWordKey(dz));

  if (!word) {
    throw new Error(`Missing curated word: ${dz}`);
  }

  return word;
};

const createModule = (id: string, title: string, words: string[]): VocabularyModule => ({
  id,
  title,
  words: words.map(pickWord),
});

const curatedModules: VocabularyModule[] = [
  createModule("core_pronouns_v2", "Moi, toi, nous", [
    "Ana",
    "Nta",
    "Ntia",
    "Houwa",
    "Hiya",
    "7na",
    "Ntouma",
    "Houma",
  ]),
  createModule("core_grammar_v2", "Les petits mots qui relient tout", [
    "Rani",
    "3andi",
    "Khassni",
    "Fi",
    "M3a",
    "Ta3",
    "Ouw",
    "Bessa7",
  ]),
  createModule("core_daily_verbs_v2", "Les verbes que tu vas sortir tout le temps", [
    "N'7ab",
    "N'dir",
    "N'ji",
    "N'ro7",
    "Nakoul",
    "Nachroub",
    "Nakhdam",
    "Naskoun",
    "Na9ra",
    "Nahdar",
  ]),
  createModule("core_question_time_v2", "Quand, où, comment", [
    "Wash",
    "Kiffach",
    "Ch7al",
    "Dorka",
    "Lyoum",
    "Lbara7",
    "Ghodwa",
    "Hna",
    "Hnak",
    "Kayan",
  ]),
  createModule("people_family_v2", "La famille, les gens, le monde autour", [
    "Khouya",
    "Khti",
    "3aila",
    "Sa7bi",
    "Sa7bati",
    "S7abi",
    "S7abati",
    "Nass",
    "Drari",
    "Bint",
    "Wald",
  ]),
  createModule("daily_actions_v2", "Les gestes du quotidien", [
    "N'chouf",
    "Nasma3",
    "Nachri",
    "Namchi",
    "Nal3ab",
    "Naktab",
    "Na3raf",
    "Na9dar",
    "N'mad",
    "N'sana",
  ]),
  createModule("daily_places_objects_v2", "La maison, le boulot, les trucs de tous les jours", [
    "Dar",
    "Khadma",
    "Sou9",
    "Sbitar",
    "7anout",
    "Sayara",
    "Tayara",
    "Makla",
    "Draham",
    "Bab",
    "Lwa9t",
  ]),
  createModule("demonstratives_possessives_v2", "À moi, à toi, celui-là", [
    "Hada",
    "Hadi",
    "Had",
    "Hadou",
    "Hadak",
    "Hadik",
    "Ta3i",
    "Ta3ek",
    "Ta3ou",
    "Ta3ha",
    "Ta3na",
  ]),
  createModule("descriptions_v2", "Décrire les choses comme on les voit", [
    "Mli7",
    "Chaba",
    "Ghaya",
    "Sahal",
    "S3ib",
    "Sghir",
    "Kbir",
    "Jdid",
    "9dim",
    "Mrigle",
    "Wa9ila",
  ]),
  createModule("social_words_v2", "Les expressions qui font la diff", [
    "Arwa7",
    "Arwa7i",
    "Arwa7ou",
    "Tfadel",
    "Maalich",
    "Madabiya",
    "Hak",
    "Haki",
    "Hakou",
    "Bssa7tek",
  ]),
  createModule("nature_world_v2", "Le ciel, la rue, la terre", [
    "Tabi3a",
    "Chams",
    "Lb7ar",
    "Djbel",
    "Ghaba",
    "Sma",
    "Chta",
    "Skhana",
    "Lahwa",
    "Trab",
  ]),
  createModule("extended_verbs_v2", "Encore plus de mots pour aller plus loin", [
    "N'7al",
    "N'7at",
    "N'khali",
    "N'fakar",
    "Natfaham",
    "N'sali",
    "N'souwar",
    "N'ghani",
    "Natmacha",
    "Naghres",
  ]),
];

const splitWordsIntoBalancedGroups = (words: VocabularyWord[]) => {
  if (words.length <= MAX_WORDS_PER_MODULE) {
    return [words];
  }

  const groupCount = Math.ceil(words.length / MAX_WORDS_PER_MODULE);
  const baseSize = Math.floor(words.length / groupCount);
  const remainder = words.length % groupCount;

  if (baseSize < MIN_WORDS_PER_MODULE) {
    throw new Error(`Unable to split ${words.length} words into modules of at least ${MIN_WORDS_PER_MODULE}.`);
  }

  const groups: VocabularyWord[][] = [];
  let startIndex = 0;

  for (let index = 0; index < groupCount; index += 1) {
    const groupSize = baseSize + (index < remainder ? 1 : 0);
    groups.push(words.slice(startIndex, startIndex + groupSize));
    startIndex += groupSize;
  }

  return groups;
};

const splitModule = (module: VocabularyModule): VocabularyModule[] => {
  if (module.words.length <= MAX_WORDS_PER_MODULE) {
    return [module];
  }

  return splitWordsIntoBalancedGroups(module.words).map((words, index) => ({
      id: `${module.id}_part_${index + 1}`,
      title: `${module.title} - Partie ${index + 1}`,
      words,
    }));
};

export const modules: VocabularyModule[] = curatedModules.flatMap(splitModule);
