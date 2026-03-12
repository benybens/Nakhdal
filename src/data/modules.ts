import lesson02PresentationExercises from "./json/lesson_02_presentation_exercises.json";
import lesson02PresentationVocab from "./json/lesson_02_presentation_vocab.json";
import lesson03Pronouns from "./json/lesson_03_pronouns.json";
import lesson03Text from "./json/lesson_03_text.json";
import lesson03Vocab from "./json/lesson_03_vocab.json";
import lesson04Demonstratives from "./json/lesson_04_demonstratives.json";
import lesson04Text from "./json/lesson_04_text.json";
import lesson04Vocab from "./json/lesson_04_vocab.json";
import lesson05KeyExpressions from "./json/lesson_05_key_expressions.json";
import lesson05TranslationSentences from "./json/lesson_05_translation_sentences.json";
import lesson05VideoVocab from "./json/lesson_05_video_vocab.json";
import lesson06Possessive from "./json/lesson_06_possessive.json";
import lesson06Text from "./json/lesson_06_text.json";
import lesson06Vocab from "./json/lesson_06_vocab.json";
import lesson07NatureSentences from "./json/lesson_07_nature_sentences.json";
import lesson07NatureVocab from "./json/lesson_07_nature_vocab.json";
import lesson08KeyExpressions from "./json/lesson_08_key_expressions.json";
import pronunciationLetters from "./json/pronunciation_letters.json";
import pronunciationPhrases1 from "./json/pronunciation_phrases_1.json";
import pronunciationPhrases2 from "./json/pronunciation_phrases_2.json";
import { VocabularyModule } from "../types";

const rawModules: VocabularyModule[] = [
  pronunciationLetters,
  pronunciationPhrases1,
  pronunciationPhrases2,
  lesson02PresentationVocab,
  lesson02PresentationExercises,
  lesson03Pronouns,
  lesson03Vocab,
  lesson03Text,
  lesson04Demonstratives,
  lesson04Vocab,
  lesson04Text,
  lesson05TranslationSentences,
  lesson05KeyExpressions,
  lesson05VideoVocab,
  lesson06Possessive,
  lesson06Vocab,
  lesson06Text,
  lesson07NatureVocab,
  lesson07NatureSentences,
  lesson08KeyExpressions,
] as VocabularyModule[];

const MAX_WORDS_PER_MODULE = 5;

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

export const modules: VocabularyModule[] = rawModules.flatMap(splitModule);
