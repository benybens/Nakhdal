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

const MAX_WORDS_PER_MODULE = 5;

const isSinglePromptTerm = (value: string) => /^[^\s,?.!;:]+$/.test(value.trim());

const wordIndex = new Map<string, VocabularyWord>();

for (const module of sourceModules) {
  for (const word of module.words) {
    if (!isSinglePromptTerm(word.dz)) {
      continue;
    }

    const key = word.dz.trim().toLowerCase();
    if (!wordIndex.has(key)) {
      wordIndex.set(key, word);
    }
  }
}

const pickWord = (dz: string): VocabularyWord => {
  const word = wordIndex.get(dz.trim().toLowerCase());

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
  createModule("core_pronouns", "1. Les mots essentiels - Pronoms", [
    "Ana",
    "Nta",
    "Ntia",
    "Houwa",
    "Hiya",
    "7na",
    "Ntouma",
    "Houma",
  ]),
  createModule("core_grammar", "2. Les mots essentiels - Liens et grammaire", [
    "Rani",
    "3andi",
    "Khassni",
    "Fi",
    "M3a",
    "Ta3",
    "Ouw",
    "Bessa7",
  ]),
  createModule("core_daily_verbs", "3. Les verbes les plus courants", [
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
  createModule("core_question_time", "4. Questions, temps et reperes", [
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
  createModule("people_family", "5. Personnes et famille", [
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
  createModule("daily_actions", "6. Actions du quotidien", [
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
  createModule("daily_places_objects", "7. Maison, travail et objets courants", [
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
  createModule("demonstratives_possessives", "8. Demonstratifs et possessifs", [
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
  createModule("descriptions", "9. Adjectifs et description", [
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
  createModule("social_words", "10. Paroles sociales et utiles", [
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
  createModule("nature_world", "11. Nature et monde", [
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
  createModule("extended_verbs", "12. Verbes et vocabulaire secondaires", [
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

const splitModule = (module: VocabularyModule): VocabularyModule[] => {
  if (module.words.length <= MAX_WORDS_PER_MODULE) {
    return [module];
  }

  const parts: VocabularyModule[] = [];

  for (let index = 0; index < module.words.length; index += MAX_WORDS_PER_MODULE) {
    const partNumber = Math.floor(index / MAX_WORDS_PER_MODULE) + 1;
    const words = module.words.slice(index, index + MAX_WORDS_PER_MODULE);

    parts.push({
      id: `${module.id}_part_${partNumber}`,
      title: `${module.title} - Part ${partNumber}`,
      words,
    });
  }

  return parts;
};

export const modules: VocabularyModule[] = curatedModules.flatMap(splitModule);
