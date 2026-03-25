import lesson02PresentationVocab from "./json/lesson_02_presentation_vocab\.json" with { type: "json" };
import lesson03Pronouns from "./json/lesson_03_pronouns\.json" with { type: "json" };
import lesson03Vocab from "./json/lesson_03_vocab\.json" with { type: "json" };
import lesson04Demonstratives from "./json/lesson_04_demonstratives\.json" with { type: "json" };
import lesson04Vocab from "./json/lesson_04_vocab\.json" with { type: "json" };
import lesson05KeyExpressions from "./json/lesson_05_key_expressions\.json" with { type: "json" };
import lesson05VideoVocab from "./json/lesson_05_video_vocab\.json" with { type: "json" };
import lesson06Possessive from "./json/lesson_06_possessive\.json" with { type: "json" };
import lesson06Vocab from "./json/lesson_06_vocab\.json" with { type: "json" };
import lesson07NatureVocab from "./json/lesson_07_nature_vocab\.json" with { type: "json" };
import lesson08KeyExpressions from "./json/lesson_08_key_expressions\.json" with { type: "json" };
import pronunciationLetters from "./json/pronunciation_letters\.json" with { type: "json" };
type LegacyWord = { dz: string; fr: string };
type LegacyLesson = { id: string; title: string; words: LegacyWord[] };
type LegacyModule = { id: string; title: string; lessons: LegacyLesson[] };

const sourceLessons: LegacyLesson[] = [
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
] as LegacyLesson[];

const MIN_WORDS_PER_LESSON = 3;
const MAX_WORDS_PER_LESSON = 15;

const normalizeWordKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[?.!;:,]+|[?.!;:,]+$/g, "");

const isSinglePromptTerm = (value: string) => /^[^\s]+$/.test(normalizeWordKey(value));

const wordIndex = new Map<string, LegacyWord>();

for (const lesson of sourceLessons) {
  for (const word of lesson.words) {
    if (!isSinglePromptTerm(word.dz)) {
      continue;
    }

    const key = normalizeWordKey(word.dz);
    if (!wordIndex.has(key)) {
      wordIndex.set(key, word);
    }
  }
}

const pickWord = (dz: string): LegacyWord => {
  const word = wordIndex.get(normalizeWordKey(dz));

  if (!word) {
    throw new Error(`Missing curated word: ${dz}`);
  }

  return word;
};

const createIndexedLesson = (id: string, title: string, words: string[]): LegacyLesson => ({
  id,
  title,
  words: words.map(pickWord),
});

const createManualLesson = (
  id: string,
  title: string,
  words: Array<[dz: string, fr: string]>,
): LegacyLesson => ({
  id,
  title,
  words: words.map(([dz, fr]) => ({ dz, fr })),
});

const splitWordsIntoBalancedLessons = (words: LegacyWord[]) => {
  if (words.length <= MAX_WORDS_PER_LESSON) {
    return [words];
  }

  const groupCount = Math.ceil(words.length / MAX_WORDS_PER_LESSON);
  const baseSize = Math.floor(words.length / groupCount);
  const remainder = words.length % groupCount;

  if (baseSize < MIN_WORDS_PER_LESSON) {
    throw new Error(`Unable to split ${words.length} words into lessons of at least ${MIN_WORDS_PER_LESSON}.`);
  }

  const groups: LegacyWord[][] = [];
  let startIndex = 0;

  for (let index = 0; index < groupCount; index += 1) {
    const groupSize = baseSize + (index < remainder ? 1 : 0);
    groups.push(words.slice(startIndex, startIndex + groupSize));
    startIndex += groupSize;
  }

  return groups;
};

const splitLesson = (lesson: LegacyLesson): LegacyLesson[] => {
  if (lesson.words.length <= MAX_WORDS_PER_LESSON) {
    return [lesson];
  }

  return splitWordsIntoBalancedLessons(lesson.words).map((words, index) => ({
    id: `${lesson.id}_part_${index + 1}`,
    title: `${lesson.title} - Partie ${index + 1}`,
    words,
  }));
};

const createModule = (id: string, title: string, lessonList: LegacyLesson[]): LegacyModule => ({
  id,
  title,
  lessons: lessonList.flatMap(splitLesson),
});

const learningModules: LegacyModule[] = [
  createModule("foundations_v2", "01. Poser les bases de ta Darija", [
    createIndexedLesson("foundations_pronouns_v2", "Moi, toi, nous", [
      "Ana",
      "Nta",
      "Ntia",
      "Houwa",
      "Hiya",
      "7na",
      "Ntouma",
      "Houma",
    ]),
    createIndexedLesson("foundations_links_v2", "Les petits mots qui relient tout", [
      "Rani",
      "3andi",
      "Khassni",
      "Fi",
      "M3a",
      "Ta3",
      "Ouw",
      "Bessa7",
    ]),
    createIndexedLesson("foundations_verbs_v2", "Les verbes que tu vas sortir tout le temps", [
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
  ]),
  createModule("daily_life_v2", "02. Survivre au quotidien", [
    createIndexedLesson("daily_life_time_v2", "Quand, où, comment", [
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
    createIndexedLesson("daily_life_people_v2", "La famille, les gens, le monde autour", [
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
    createIndexedLesson("daily_life_actions_v2", "Les gestes du quotidien", [
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
    createIndexedLesson("daily_life_places_v2", "La maison, le boulot, les trucs de tous les jours", [
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
  ]),
  createModule("grammar_descriptions_v2", "04. Montrer, décrire, réagir", [
    createIndexedLesson("grammar_demonstratives_v2", "À moi, à toi, celui-là", [
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
    createIndexedLesson("grammar_descriptions_v2", "Décrire les choses comme on les voit", [
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
    createIndexedLesson("grammar_social_v2", "Les expressions qui font la diff", [
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
  ]),
  createModule("nature_extension_v2", "19. Élargir ton vocabulaire utile", [
    createIndexedLesson("nature_world_v2", "Le ciel, la rue, la terre", [
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
    createIndexedLesson("extended_verbs_v2", "Encore plus de mots pour aller plus loin", [
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
  ]),
  createModule("chapter_01_demonstratives_v1", "05. Pointer les choses autour de toi", [
    createManualLesson("chapter_01_demo_pronouns_v1", "Pronoms démonstratifs", [
      ["Hada", "Ce / cet"],
      ["Hadi", "Cette"],
      ["Had", "Ce / cette"],
      ["Hadou", "Ces"],
      ["Hadak", "Celui-là"],
      ["Hadik", "Celle-là"],
      ["Hadouk", "Ceux-là / celles-là"],
    ]),
    createManualLesson("chapter_01_demo_video_nouns_v1", "Vocabulaire vidéo · noms", [
      ["Tayara", "Avion"],
      ["War9a", "Feuille"],
      ["Sayyad", "Monsieur"],
      ["Kalb", "Chien"],
      ["7anout", "Magasin"],
      ["9issa", "Conte / histoire"],
      ["Dourouss", "Les cours"],
      ["Bint", "Fille"],
      ["Wald", "Garçon"],
      ["Zarbia", "Tapis"],
    ]),
    createManualLesson("chapter_01_demo_video_verbs_v1", "Vocabulaire vidéo · verbes", [
      ["N'safar", "Voyager"],
      ["N'ji", "Venir"],
      ["Nachri", "Acheter"],
    ]),
    createManualLesson("chapter_01_demo_exercise_vocab_v1", "Pratique · objets et repères", [
      ["Tre9", "Route"],
      ["Sa3a", "Montre"],
      ["Nass", "Les gens"],
      ["Dourouss", "Les cours"],
      ["Hna", "Ici"],
      ["Hnak", "Là-bas"],
      ["Bwaber", "Bateaux"],
      ["Drari", "Les enfants"],
      ["7alwa", "Friandise"],
      ["Nhar", "Jour"],
    ]),
  ]),
  createModule("chapter_01_trip_v1", "15. Parler de projet, trajet et envie", [
    createManualLesson("chapter_01_trip_verbs_v1", "Texte · verbes", [
      ["Na3raf", "Connaitre"],
      ["Na9dar", "Pouvoir"],
      ["Na9ra", "Lire / étudier"],
      ["Naktab", "Écrire"],
      ["Nahdar", "Parler"],
      ["Nasbar", "Attendre"],
      ["Namchi", "Partir"],
    ]),
    createManualLesson("chapter_01_trip_nouns_v1", "Texte · noms", [
      ["Tre9", "Route / chemin"],
      ["Makla", "Nourriture"],
      ["Sa7ra", "Désert"],
      ["Dorka", "Maintenant"],
      ["Lyoum", "Aujourd'hui"],
      ["Lbara7", "Hier"],
      ["Ghodwa", "Demain"],
      ["L'dakhal", "À l'intérieur"],
      ["Bara", "Extérieur"],
      ["Nhar", "Jour"],
    ]),
    createManualLesson("chapter_01_trip_grammar_v1", "Prépositions et adjectifs", [
      ["Ba3d", "Après"],
      ["9bal", "Avant"],
      ["Twil", "Long"],
      ["Ghali", "Cher"],
      ["Bnin", "Délicieux"],
      ["Sghir", "Petit"],
      ["Kbir", "Grand"],
      ["M9ala9", "Impatient"],
    ]),
    createManualLesson("chapter_01_trip_expressions_v1", "Expressions et conjonctions", [
      ["Maalich", "Ce n'est pas grave"],
      ["Tani", "Aussi"],
      ["Khir", "C'est mieux"],
      ["Arwa7", "Viens"],
      ["Arwa7i", "Viens (fem.)"],
      ["Arwa7ou", "Venez"],
      ["Bach", "Pour"],
      ["Lazam", "Il faut"],
      ["Ida", "Si"],
      ["Lianou", "Parce que"],
    ]),
  ]),
  createModule("chapter_01_translation_v1", "07. Passer aux phrases complètes", [
    createManualLesson("chapter_01_translation_core_verbs_v1", "Verbes indispensables", [
      ["Rani", "Être / être en train de"],
      ["3andi", "Avoir / chez moi selon le contexte"],
      ["Khassni", "Avoir besoin / devoir"],
      ["Arwa7", "Viens !"],
      ["Arwa7i", "Viens ! (fem.)"],
      ["Arwa7ou", "Venez !"],
    ]),
    createManualLesson("chapter_01_translation_sentences_a_v1", "Traduction · phrases 1", [
      ["Ana khassni nakoul makla ta3ek lyoum", "Je dois manger ta nourriture aujourd'hui"],
      ["Houwa lazam y'ro7 3and l'moudir", "Il doit aller chez le directeur"],
      ["Ana na9dar n'ji lyoum 3andek?", "Je peux venir chez toi aujourd'hui ?"],
      ["Ida t'7ab, ana na9dar namchi ghodwa n'chouf 3aila ta3ek", "Si tu veux, je peux aller demain voir ta famille"],
      ["Lazam nakoul 9bal bach nakhrouj", "Il faut que je mange avant de sortir"],
      ["Lazam nahdar m3ak", "Il faut que je parle avec toi"],
      ["Ana n'ro7 naktab, n'ji mba3d, bach nakhdam", "Je vais ecrire, je viens apres, pour travailler"],
    ]),
    createManualLesson("chapter_01_translation_sentences_b_v1", "Traduction · phrases 2", [
      ["Lazam n'7al ta9a bach n'chouf mli7", "Il faut que j'ouvre la fenetre pour bien voir"],
      ["Lyoum lazam n'dir had projet lianou ana n'7ab n'chouf natija", "Aujourd'hui il faut que je fasse ce projet parce que je veux voir le resultat"],
      ["Had la solution mli7a, bessa7 ana 3andi khir", "Cette solution est bonne, mais j'en ai une meilleure"],
      ["Lazam namchi l'baladia dorka", "Je dois aller a la mairie maintenant"],
      ["Arwa7 n'dirou machrou3 fi ra7ba", "Viens, on fait un projet ensemble"],
      ["Rani dorka 3and tbib, douk n'dir marchi, ouw n'ji l'dar f'lil", "Je suis maintenant chez le medecin, ensuite je fais les courses, et je rentre a la maison la nuit"],
    ]),
  ]),
  createModule("chapter_01_bila_houdoud_v1", "17. Comprendre l'humour du quotidien", [
    createManualLesson("chapter_01_bila_houdoud_intro_v1", "Sketch · repères", [
      ["Bla", "Sans"],
      ["7oudoud", "Frontières"],
      ["Bla 7oudoud", "Sans frontières"],
      ["Arja", "Doucement"],
      ["A bechuiya", "Doucement"],
      ["Ma dakhal ch rou7ek", "Ne te mele pas de ça"],
    ]),
    createManualLesson("chapter_01_bila_houdoud_market_v1", "Sketch · marché", [
      ["Salam alikoum khouya", "Salut mon frère"],
      ["Ch7al?", "Combien ?"],
      ["3tina kilo khouya", "Donne-nous un kilo mon frère"],
      ["Tfadel khouya", "Tenez, je vous en prie mon frère"],
      ["Hadi Thomson oula clementine?", "C'est une Thomson ou une clementine ?"],
      ["Hadi ki tsemiha?", "Celle-là, comment tu l'appelles ?"],
      ["Gadi l'hameçon", "Ça, c'est l'hameçon"],
    ]),
    createManualLesson("chapter_01_bila_houdoud_fish_v1", "Sketch · poisson", [
      ["Kayan rouji, pajot, merlan", "Il y a du poisson rouge, du pajot, du merlan"],
      ["Hatli soupe de poisson", "Ramene-moi une soupe de poisson"],
      ["Aya bssa7tek khouya", "Allez, a ta sante mon frère"],
      ["Arwa7 khouya!", "Viens mon frère !"],
      ["Chta kayen?", "Qu'est-ce qu'il y a ?"],
      ["La soupe rani nchouf fiha, ouw l'poisson win raha?", "La soupe je la regarde, mais le poisson ou est-il ?"],
      ["Ah l'poisson win rah?", "Ah, le poisson ou est-il ?"],
    ]),
    createManualLesson("chapter_01_bila_houdoud_notes_v1", "Vidéo · remarques utiles", [
      ["Kiffach", "Comment"],
      ["Kich", "Comment"],
      ["Ki", "Comment"],
      ["Wash", "Quoi / est-ce que"],
      ["Chta", "Quoi / qu'est-ce que"],
      ["Kessrat la3rab", "Le pain des arabes"],
    ]),
  ]),
  createModule("chapter_01_possessive_v1", "06. Dire à qui ça appartient", [
    createManualLesson("chapter_01_possessive_core_v1", "Possessif · bases", [
      ["Ta3i", "Le mien / à moi"],
      ["Ta3ek", "Le tien / à toi"],
      ["Ta3ou", "Le sien / à lui"],
      ["Ta3ha", "Le sien / à elle"],
      ["Ta3na", "Le notre / à nous"],
      ["Ta3koum", "Le votre / à vous"],
      ["Ta3houm", "Le leur / à eux"],
    ]),
    createManualLesson("chapter_01_possessive_video1_verbs_v1", "Vidéo 01 · verbes", [
      ["Nasma3", "Ecouter"],
      ["Nadi", "Prendre"],
      ["Naguedi", "Allumer"],
      ["Nach3al", "Allumer"],
      ["Nal9a", "Trouver / retrouver"],
      ["N'chouf", "Regarder"],
      ["N'dir", "Faire"],
      ["N'souwar", "Photographier"],
      ["N'na7i", "Enlever"],
    ]),
    createManualLesson("chapter_01_possessive_video1_nouns_v1", "Vidéo 01 · noms", [
      ["Khadma", "Le travail"],
      ["Frach", "Lit"],
      ["Yad", "Main"],
      ["Rass", "Tete"],
    ]),
    createManualLesson("chapter_01_possessive_video2_verbs_a_v1", "Vidéo 02 · verbes A", [
      ["Nakoul", "Manger"],
      ["Namchi", "Partir"],
      ["Nal3ab", "Jouer"],
      ["Nal9a", "Trouver / retrouver"],
      ["Nachroub", "Boire"],
      ["Nachri", "Acheter"],
      ["Natfaham", "Se mettre d'accord"],
    ]),
    createManualLesson("chapter_01_possessive_video2_verbs_b_v1", "Vidéo 02 · verbes B", [
      ["N'ro7", "Partir"],
      ["N'ji", "Venir"],
      ["N'7al", "Ouvrir"],
      ["N'sawar", "Photographier"],
      ["N'7at", "Poser"],
      ["N'chouf", "Regarder"],
      ["N'mad", "Donner"],
      ["N'dir", "Faire"],
      ["N'na7i", "Enlever"],
    ]),
    createManualLesson("chapter_01_possessive_practice_v1", "Pratique · phrases", [
      ["Hiya t'ji m3aya l'sou9", "Elle vient avec moi au marche"],
      ["Ana nasma3koum ghaya", "Je vous entends tres bien"],
      ["Ta3koum had projet?", "C'est a vous ce projet ?"],
      ["Ana n'dawihoum f'sbitar", "Je les soigne a l'hopital"],
      ["Ana nafham darss ta3ha lyoum", "Je comprends son cours aujourd'hui"],
      ["Ana naguedieh le moteur dorka", "J'allume le moteur maintenant"],
      ["Ana n'choufha lyoum f'lkhadma", "Je la vois aujourd'hui au travail"],
    ]),
    createManualLesson("chapter_01_possessive_practice_more_v1", "Pratique · phrases 2", [
      ["Bab ta3i ta3 dari wasa3", "La porte de ma maison est large"],
      ["Ana n'na7i lista bach n'direk f'lista jdida", "J'enleve la liste pour te mettre dans la nouvelle liste"],
      ["Ana n'7ab nasam3ek lyoum", "Je veux t'ecouter aujourd'hui"],
      ["Ana nal9akoum f la salle des fetes ghodwa?", "Je vous retrouve a la salle des fetes demain ?"],
      ["Ana n'7ab n'madhoum draham l'msakin", "Je veux donner de l'argent aux pauvres"],
    ]),
    createManualLesson("chapter_01_possessive_exercise_vocab_v1", "Exercice · vocabulaire", [
      ["Lwa9t", "Temps"],
      ["Lazam", "Il faut"],
      ["Bach", "Pour"],
      ["L'9at", "Le chat"],
      ["Ga3", "Tous"],
      ["Sou9", "Marche"],
      ["Msakin", "Les pauvres"],
      ["Sbitar", "Hopital"],
      ["Draham", "Argent"],
      ["Bab", "Porte"],
    ]),
    createManualLesson("chapter_01_possessive_reading_v1", "Lecture · lbaladia", [
      ["Dakhla", "L'entree"],
      ["Lkharja", "La sortie"],
      ["Lbaladia", "La mairie"],
      ["Hnak", "La-bas"],
      ["Hna", "Ici"],
      ["Wasa3", "Large"],
      ["Jdid", "Nouveau"],
      ["9dim", "Ancien"],
      ["Mrigle", "En regle / correct"],
    ]),
    createManualLesson("chapter_01_possessive_reading_verbs_v1", "Lecture · verbes", [
      ["N'9oul", "Dire"],
      ["N'sali", "Prier"],
      ["N'koun", "Etre au futur"],
      ["N'saguam", "Arranger / organiser"],
      ["N'7ab", "Aimer"],
      ["N'ghani", "Chanter"],
      ["N'sana", "Attendre"],
      ["N'fakar", "Penser"],
    ]),
  ]),
  createModule("chapter_01_nature_climate_v1", "14. Décrire le monde autour de toi", [
    createManualLesson("chapter_01_nature_climate_intro_v1", "Description · mots de base", [
      ["Mandhar", "Paysage"],
      ["Tabi3a", "Nature"],
      ["L7al", "Climat / temps"],
      ["Ndirou chuiya wassf", "Faisons un peu de description"],
      ["Nawssaf wach rani nchouf", "Je decris ce que je suis en train de voir"],
    ]),
    createManualLesson("chapter_01_nature_climate_vocab_a_v1", "Nature · vocabulaire 1", [
      ["Ghyam", "Nuages"],
      ["Chajrat", "Arbres"],
      ["Sma", "Ciel"],
      ["7chich", "Verdure"],
      ["Dhel", "Ombre"],
      ["Djbel", "Montagne"],
      ["Lard", "La terre"],
    ]),
    createManualLesson("chapter_01_nature_climate_vocab_b_v1", "Nature · vocabulaire 2", [
      ["Lb7ar", "La mer"],
      ["Trab", "Sable / terre"],
      ["Skhana", "Chaleur"],
      ["Lahwa", "L'air"],
      ["Zwawech", "Oiseaux"],
      ["Chet", "Bord de mer"],
      ["Amwaj", "Vagues"],
    ]),
    createManualLesson("chapter_01_nature_climate_phrase_1_v1", "Phrases · foret et climat", [
      ["Ghodwa douk l7al ma ykounch mli7", "Demain le climat ne va pas etre bon"],
      ["Lazam nalbass manteau", "Il faut que je porte un manteau"],
      ["Ouw nalbass bonnet bach ma namradch", "Et je porte un bonnet pour ne pas tomber malade"],
      ["Douk nro7 natmacha fal ghaba chuiya", "Je vais partir marcher un peu dans la foret"],
    ]),
    createManualLesson("chapter_01_nature_climate_phrase_2_v1", "Phrases · soleil et nuages", [
      ["Lyoum l7al chbab bezaf", "Aujourd'hui le climat est tres beau"],
      ["Kayen chams ouw sma zarga safia", "Il y a du soleil et le ciel est bleu pur"],
      ["Lbara7 l7al kan mghayem bezaf", "Hier le temps etait tres nuageux"],
      ["Ouw nouw kanat tsoub bessa7 lyoum mchamess", "Et il pleuvait mais aujourd'hui c'est ensoleille"],
    ]),
    createManualLesson("chapter_01_nature_climate_phrase_3_v1", "Phrases · arbres et ciel", [
      ["3andi lwa9t lyoum", "Aujourd'hui j'ai du temps"],
      ["Douk naghress chajrat 9adam dar", "Je vais planter des arbres a cote de la maison"],
      ["Lyoum sma chbab ouw kayen chamss", "Aujourd'hui le ciel est beau et il y a du soleil"],
      ["Kayen chuiya ghyam", "Il y a quelques nuages"],
      ["Kayan zwawech bezaf", "Il y a beaucoup d'oiseaux"],
    ]),
    createManualLesson("chapter_01_nature_climate_phrase_4_v1", "Phrases · a la mer", [
      ["Rani f'lb7ar lyoum", "Je suis a la mer aujourd'hui"],
      ["L7al chbab ouw sma zarga safia", "Le temps est beau et le ciel est bleu pur"],
      ["Lb7ar tabla ouw ma kayanch l'amwaj", "La mer est calme et il n'y a pas de vagues"],
      ["Kayan zwawech 3la chet", "Il y a des oiseaux au bord de la mer"],
      ["N7ess skhana, nchem lahwa ta3 lab7ar", "Je sens la chaleur et l'air de la mer"],
      ["Rani khalwi", "Je suis bien / je profite du moment"],
    ]),
  ]),
  createModule("chapter_01_key_expressions_v2", "09. Sonner plus naturel", [
    createManualLesson("chapter_01_expr_wa9ila_v1", "Wa9ila · peut-etre", [
      ["Wa9ila", "Peut-etre"],
      ["Wa9ila douk dyaf yjiou", "Peut-etre que les invites vont venir"],
      ["Wa9ila lyoum douk tsoub nouw", "Peut-etre qu'aujourd'hui il va pleuvoir"],
      ["Wa9ila douk yjou lyoum", "Peut-etre qu'ils vont venir aujourd'hui"],
      ["Wa9ila ma sma3ch ghaya", "Peut-etre qu'il n'a pas bien ecoute"],
      ["Wa9ila raha 3and tbib", "Peut-etre qu'elle est chez le medecin"],
    ]),
    createManualLesson("chapter_01_expr_madabi_v1", "Madabi · j'aimerais bien", [
      ["Madabiya", "J'aimerais bien"],
      ["Madabiek", "Tu aimerais bien"],
      ["Madabieh", "Il aimerait bien"],
      ["Madabiha", "Elle aimerait bien"],
      ["Madabina", "Nous aimerions bien"],
      ["Madabikoum", "Vous aimeriez bien"],
      ["Madabihoum", "Ils aimeraient bien"],
    ]),
    createManualLesson("chapter_01_expr_madabi_phrases_v1", "Madabi · phrases", [
      ["Madabiya n'ro7 lparc lyoum", "J'aimerais bien partir aujourd'hui au parc"],
      ["Madabiek t'ji l'jazayer?", "Tu voudrais bien venir en Algerie ?"],
      ["Madabiha t'ji m3ana?", "Elle aimerait bien venir avec nous ?"],
      ["Madabieh y'ro7 ysaffar?", "Il aimerait bien partir voyager ?"],
      ["Madabikoum safar f'jazayer?", "Vous aimeriez bien un voyage en Algerie ?"],
    ]),
    createManualLesson("chapter_01_expr_tbanli_v1", "Tbanli · je pense que", [
      ["Tbanliya", "Je pense que"],
      ["Tbanlek", "Tu penses que"],
      ["Tbanleh", "Il pense que"],
      ["Tbanlha", "Elle pense que"],
      ["Tbanlna", "Nous pensons que"],
      ["Tbanlkoum", "Vous pensez que"],
      ["Tbanlhoum", "Ils pensent que"],
    ]),
    createManualLesson("chapter_01_expr_tbanli_phrases_v1", "Tbanli · phrases", [
      ["Tbanli l'idee chaba", "Je pense que l'idee est belle"],
      ["Kiffach tbanlek?", "Qu'est-ce que tu penses ?"],
      ["Tbanleh normal?", "Ca lui parait normal ?"],
      ["Tbanelha 3la gateau dorka", "Elle pense a un gateau maintenant"],
      ["Tbanlkoum l'jazayer chaba?", "Vous pensez que l'Algerie est belle ?"],
    ]),
    createManualLesson("chapter_01_expr_moul_v1", "Moul · celui a qui appartient", [
      ["Moul", "Celui a qui appartient la chose"],
      ["Moulat", "Celle a qui appartient la chose"],
      ["Mwalin", "Ceux a qui appartient la chose"],
      ["Moul dar", "Celui a qui appartient la maison"],
      ["Moulat ch3ar twil", "Celle qui a les cheveux longs"],
      ["Mwalin dar", "Ceux a qui appartient la maison"],
      ["Nadjet moulat sayara", "Nadjet, celle a qui appartient la voiture"],
    ]),
    createManualLesson("chapter_01_expr_hak_v1", "Hak · tiens", [
      ["Hak", "Tiens !"],
      ["Haki", "Tiens ! (fem.)"],
      ["Hakou", "Tenez !"],
      ["Hak had plan", "Tiens ce plan !"],
      ["Haki mfati7 ta3 sayara", "Tiens les cles de la voiture !"],
      ["Hakou passport ta3koum", "Tenez votre passeport !"],
    ]),
    createManualLesson("chapter_01_expr_7ssabni_v1", "7ssabni · je pensais que", [
      ["7ssabni", "Je pensais que"],
      ["7ssabek", "Tu pensais que"],
      ["7ssabeh", "Il pensait que"],
      ["7ssabha", "Elle pensait que"],
      ["7ssabna", "Nous pensions que"],
      ["7ssabkoum", "Vous pensiez que"],
      ["7ssabhoum", "Ils pensaient que"],
    ]),
    createManualLesson("chapter_01_expr_7ssabni_phrases_v1", "7ssabni · phrases", [
      ["7ssabni nta kount hna", "Je pensais que tu etais ici"],
      ["7ssabni ntouma rakoum f dar", "Je pensais que vous etiez a la maison"],
      ["7ssabni l'jazayer sghira", "Je pensais que l'Algerie etait petite"],
      ["Dirni fi 7ssabek", "Ne m'oublie pas"],
      ["Dirini fi 7ssabek", "Ne m'oublie pas (fem.)"],
      ["Dirouni fi 7ssabkoum", "Ne m'oubliez pas"],
    ]),
    createManualLesson("chapter_01_expr_mou7al_v1", "Mou7al · impossible / peut-etre pas", [
      ["Mou7al", "Impossible / peut-etre pas"],
      ["Mou7al nji lyoum", "Impossible que je vienne aujourd'hui"],
      ["Tji ghodwa? Mou7al", "Tu viens demain ? Peut-etre pas"],
      ["Mou7al ntouma takhadmou haka", "Impossible que vous travailliez comme ca !"],
    ]),
  ]),
  createModule("chapter_01_babylone_v1", "18. Comprendre une chanson connue", [
    createManualLesson("chapter_01_babylone_intro_v1", "Babylone · presentation", [
      ["Fir9a", "Groupe"],
      ["T2assast", "S'est forme / a ete cree"],
      ["Matkawna", "Est compose"],
      ["Tlatha s7ab", "Trois amis"],
      ["Dziri style", "Style algerien"],
      ["Lamssa", "Une touche"],
    ]),
    createManualLesson("chapter_01_babylone_story_v1", "Babylone · histoire du groupe", [
      ["El ghonya Zina daret buzz fal 3alem", "La chanson Zina a fait le buzz dans le monde"],
      ["Bezaf fenanin mel 3alem tarjmou el ghonya", "Beaucoup d'artistes dans le monde ont traduit la chanson"],
      ["Fi Loubnan ouw Marikan", "Au Liban et aux Etats-Unis"],
      ["El fir9a takteb moussi9a ta3ha bal 3arabia djazairia", "Le groupe ecrit sa musique en arabe algerien"],
      ["T2aked 3la Dziri style", "Ils affirment le Dziri style"],
    ]),
    createManualLesson("chapter_01_babylone_explanations_v1", "Babylone · mots a retenir", [
      ["N2assas", "Former / creer"],
      ["Matkawna", "Compose / constitue"],
      ["N2aked", "Affirmer / assurer"],
      ["Khassa bik", "Une chose propre a toi"],
      ["Nalmess", "Toucher"],
      ["Lamssa", "Une touche"],
    ]),
    createManualLesson("chapter_01_babylone_couplet_verbs_v1", "Zina · couplet 1 verbes", [
      ["Natmana", "Esperer"],
      ["Naktab", "Ecrire"],
      ["Narmi", "Jeter"],
      ["Nansa", "Oublier"],
      ["Nkoun", "Etre au futur"],
      ["Nchouf", "Regarder"],
      ["Ntaba3", "Suivre"],
      ["N7at", "Deposer"],
      ["Nwada3", "Faire les adieux"],
      ["Nwassi", "Conseiller / recommander"],
      ["N9oul", "Dire"],
    ]),
    createManualLesson("chapter_01_babylone_couplet_vocab_v1", "Zina · couplet 1 vocabulaire", [
      ["Safi", "Pur / clair / honnete"],
      ["Hwa", "Passion / air"],
      ["B7ar", "La mer"],
      ["Ri7", "Le vent"],
      ["Riya7", "Les vents"],
      ["El 7ub", "L'amour"],
      ["7bibi", "Mon etre cher"],
      ["Maktoub", "Le destin / l'ecrit"],
    ]),
    createManualLesson("chapter_01_babylone_couplet_lines_v1", "Zina · couplet 1 phrases", [
      ["Lyoum rani m3ak ghodwa tani matmani", "Aujourd'hui je suis avec toi et demain aussi, en esperant"],
      ["Yaktab el maktoub ouw nkoun 7daek", "Que le destin s'ecrive et que je sois pres de toi"],
      ["Ya 9albi chouf hwaek win rmani", "Mon coeur, regarde ou ta passion m'a jete"],
      ["Fou9 b7ar safi b mwajou dani m3ah", "Au-dessus d'une mer claire, ses vagues m'ont emporte avec elles"],
      ["Taba3 riya7 el 7ub ouw 3andek 7atni", "Suivant les vents de l'amour, il m'a depose chez toi"],
      ["Wassani ouw 9ali 7bibek ma tansaeh", "Il m'a recommande de ne pas oublier ton amour"],
    ]),
    createManualLesson("chapter_01_babylone_refrain_v1", "Zina · refrain", [
      ["Ma darti fina", "Ce que tu nous as fait"],
      ["7awessna 3liek ma l9ina", "Nous t'avons cherche sans te trouver"],
      ["Ndir", "Faire"],
      ["N7awess", "Chercher / se balader"],
      ["Nal9a", "Trouver"],
      ["Zin", "Beau"],
      ["Zina", "Belle"],
      ["Zinin", "Beaux"],
    ]),
    createManualLesson("chapter_01_babylone_expressions_v1", "Zina · expressions", [
      ["Matmani tkoun labass?", "J'espere que tu vas bien ?"],
      ["Natmana tkoun labass", "J'espere que tu vas bien"],
      ["Ma dar fiya", "Ce qu'il m'a fait"],
      ["Ma darti fiya", "Ce que tu m'as fait"],
      ["Ma dartou fiya", "Ce que vous m'avez fait"],
      ["N7awess 3liek", "Je te cherche"],
      ["Ma tansaeh", "Ne l'oublie pas"],
    ]),
  ]),
  createModule("chapter_01_translation_2_v1", "08. Parler dans des situations concrètes", [
    createManualLesson("chapter_01_translation_2_phrases_a_v1", "Traduction 2 · phrases 1", [
      ["3andi l'wa9t dorka", "J'ai le temps maintenant"],
      ["N'ro7 n'chouf khouya", "Je vais voir mon frere"],
      ["Ida n'ji lyoum, douk namchi ghodwa", "Si je viens aujourd'hui, j'irai demain"],
      ["Ana nach3al climatisseur, lianou skhana", "J'allume la climatisation, parce qu'il fait chaud"],
      ["Nta ouw ana, lazam n'ro7ou 3and l'3aila ta3na", "Toi et moi, on doit aller chez notre famille"],
      ["Rani dorka fal banka", "Je suis maintenant a la banque"],
      ["Hadi sayara ta3ek? ana n'7ab n'ro7 biha", "C'est ta voiture ? Je veux y aller avec"],
    ]),
    createManualLesson("chapter_01_translation_2_phrases_b_v1", "Traduction 2 · phrases 2", [
      ["Koul lyoum ana n'7ab namchi lab7ar", "Chaque jour j'aime aller a la plage"],
      ["Nta rak t'calculi faux", "Toi, tu calcules faux"],
      ["Ana n'7ab namchi l'parc sba7, ki y'koun khawi", "J'aime aller au parc le matin, quand il est vide"],
      ["Lazam n'ji l'khadma dorka", "Je dois venir au travail maintenant"],
      ["Ana n'7ab dima n'choufek", "Je veux toujours te voir"],
      ["Ntia ta7ki had l'9issa koul nhar", "Tu racontes cette histoire chaque jour"],
      ["Arwa7 n'dirou machrou3 fi ra7ba", "Viens, on fait un projet ensemble"],
      ["N'7ab nakhrouj nachri makla", "Je veux sortir acheter de la nourriture"],
    ]),
    createManualLesson("chapter_01_translation_2_vocab_v1", "Traduction 2 · vocabulaire", [
      ["Nadkhoul", "Rentrer"],
      ["Nakhrouj", "Sortir"],
      ["Na7ki", "Raconter"],
      ["Douk", "Marqueur du futur"],
      ["Lbard", "Froid"],
      ["Simana", "Semaine"],
      ["Khawi", "Vide"],
      ["Dow", "Lumiere / electricite"],
      ["9issa", "Histoire / conte"],
      ["7kaya", "Petite histoire / conte"],
      ["Fi ra7ba", "Ensemble"],
    ]),
    createManualLesson("chapter_01_translation_2_video1_v1", "Sketch 1 · lecture", [
      ["Choufli khouya had l'adresse", "Regarde-moi cette adresse, mon frere"],
      ["Manich 9ari l'7adj", "Je ne sais pas lire cette chose"],
      ["Ga3 had l'7atta, chapeau, ouw nwader, ouw blouson ta3 cuir", "Toute cette tenue, chapeau, lunettes et blouson en cuir"],
      ["Machi 9ari?", "Et tu ne sais pas lire ?"],
      ["Ha chapeau, ha nwader, 9raha nta darwag", "Voila le chapeau, voila les lunettes, lis-la maintenant"],
    ]),
    createManualLesson("chapter_01_translation_2_video2_v1", "Sketch 2 · honneur et voyage", [
      ["Malek khouya men nifek?", "Qu'est-ce que tu as a ton nez, mon frere ?"],
      ["Ghodwa nchalah rani m9ala3 lfrança", "Demain si Dieu veut, je pars pour la France"],
      ["Bouya wassani ouw gali", "Mon pere m'a conseille et m'a dit"],
      ["Ahrazz, ki tawssal ttaya7 nifek", "Fais attention, quand tu arrives, ne fais pas tomber ton honneur"],
    ]),
    createManualLesson("chapter_01_translation_2_notes_v1", "Sketches · remarques utiles", [
      ["Manich", "Je ne suis pas"],
      ["Darwag", "Maintenant"],
      ["Douka", "Maintenant"],
      ["Darwa2", "Maintenant"],
      ["Ttaya7 nifek", "Faire tomber ton honneur"],
      ["Ttay7i nifek", "Faire tomber ton honneur (fem.)"],
      ["Ahrazz", "Fais attention"],
      ["Ballak", "Fais attention"],
      ["3andek", "Fais attention"],
    ]),
  ]),
  createModule("chapter_01_family_v1", "11. Parler de ta famille et de tes proches", [
    createManualLesson("chapter_01_family_core_v1", "Famille · mots de base", [
      ["Khout", "Les freres"],
      ["Khawtat", "Les soeurs"],
      ["Lwaldin", "Les parents"],
      ["Waldiya", "Mes parents"],
      ["Beba", "Papa"],
      ["Yima", "Maman"],
      ["3aila", "Famille"],
    ]),
    createManualLesson("chapter_01_family_phrases_v1", "Famille · phrases", [
      ["Ana nro7 nzour 3aila ta3i", "Je pars visiter ma famille"],
      ["Twa7acht khouya ouw khti", "Mon frere et ma soeur me manquent"],
      ["Eli twa7achthoum bezaf houma waldiya", "Ceux qui m'ont le plus manque sont mes parents"],
      ["Twahacht 3aila ta3i ta3 l'djazayer", "Ma famille d'Algerie me manque"],
      ["Lazam namchi nchoufhoum had sayf", "Il faut que j'aille les voir cet ete"],
      ["3aila ta3i macha Allah", "Ma famille est magnifique"],
      ["Madabiya natla9a m3a les cousins ta3i", "J'aimerais bien rencontrer mes cousins"],
    ]),
    createManualLesson("chapter_01_family_parents_v1", "Parents · possessif", [
      ["Waldiya", "Mes parents"],
      ["Waldiek", "Tes parents"],
      ["Waldiah", "Ses parents a lui"],
      ["Waldiha", "Ses parents a elle"],
      ["Waldina", "Nos parents"],
      ["Waldikoum", "Vos parents"],
      ["Waldihoum", "Leurs parents"],
    ]),
    createManualLesson("chapter_01_family_paternal_v1", "Famille paternelle", [
      ["3am", "Oncle paternel"],
      ["3amti", "Ma tante paternelle"],
      ["Wald l'3am", "Cousin paternel"],
      ["Wald l'3ama", "Cousin du cote de la tante paternelle"],
      ["Bint l'3am", "Cousine paternelle"],
      ["Bint l'3ama", "Cousine du cote de la tante paternelle"],
    ]),
    createManualLesson("chapter_01_family_maternal_v1", "Famille maternelle", [
      ["Khal", "Oncle maternel"],
      ["Khalti", "Ma tante maternelle"],
      ["Wald l'khal", "Cousin maternel"],
      ["Wald l'khala", "Cousin du cote de la tante maternelle"],
      ["Bint l'khal", "Cousine maternelle"],
      ["Bint l'khala", "Cousine du cote de la tante maternelle"],
    ]),
    createManualLesson("chapter_01_family_spouse_v1", "Conjoint", [
      ["Rajal", "Mari / homme"],
      ["Rajli", "Mon epoux"],
      ["Mra", "Femme / epouse"],
      ["Mrati", "Mon epouse"],
      ["Zawji", "Mon epoux"],
      ["Zawja", "Mon epouse"],
    ]),
    createManualLesson("chapter_01_family_grandparents_v1", "Grands-parents", [
      ["Jad", "Grand-pere"],
      ["Jadi", "Mon grand-pere"],
      ["Jada", "Grand-mere"],
      ["Jadati", "Ma grand-mere"],
      ["Jadek", "Ton grand-pere"],
      ["Jadatek", "Ta grand-mere"],
    ]),
    createManualLesson("chapter_01_family_children_v1", "Enfants", [
      ["Wald", "Fils / garcon"],
      ["Waldi", "Mon fils"],
      ["Bint", "Fille"],
      ["Binti", "Ma fille"],
      ["Wlad", "Les enfants"],
      ["Waldek", "Ton fils"],
      ["Bintek", "Ta fille"],
    ]),
    createManualLesson("chapter_01_family_guest_v1", "Chez une famille · expressions", [
      ["Sa7itou, baraka allahou fikoum 3la l'invitation", "Merci beaucoup pour l'invitation"],
      ["Tyab bnin, ouw makla mli7a", "Une bonne cuisine et une bonne nourriture"],
      ["N'7ab nachroub lma", "Je veux boire de l'eau"],
      ["N'7ab n'zid", "Je voudrais en rajouter"],
      ["Makla bnina bezaf", "La nourriture est tres delicieuse"],
      ["Lazam namchi", "Il faut que je parte"],
      ["Lazam namchiou", "Il faut qu'on parte"],
      ["Chba3t, sa7itou", "Je suis rassasie, merci a vous"],
    ]),
  ]),
  createModule("chapter_01_reading_intro_v1", "12. Lire ton premier vrai texte", [
    createManualLesson("chapter_01_reading_intro_text_a_v1", "Lecture · texte 1", [
      ["Ana ismi Nadjet", "Je m'appelle Nadjet"],
      ["Ana m l'Djazayar", "Je suis d'Algerie"],
      ["Ana naskoun f'Tlemcen", "J'habite a Tlemcen"],
      ["Yima oustada, ouw beba tbib", "Maman est enseignante et papa est medecin"],
      ["3andi khouya", "J'ai un frere"],
      ["Houwa 3andah 15 ans", "Il a 15 ans"],
      ["Ana n'7ab sport", "J'aime le sport"],
      ["Sport favori ta3i houwa la plongee sous marine", "Mon sport favori est la plongee sous-marine"],
    ]),
    createManualLesson("chapter_01_reading_intro_text_b_v1", "Lecture · texte 2", [
      ["Ki y'ji week end, ana n'noud 3la sab3a ta3 sba7", "Quand le week-end arrive, je me leve a 7h du matin"],
      ["Nachroub 9ahwa, ouw nakoul mli7", "Je bois du cafe et je mange bien"],
      ["Ouw n'dir un bain mba3d", "Et je prends un bain apres"],
      ["Fi wa9t l'khadma, ana n'ro7 b sayara ta3i", "Pendant le travail, j'y vais avec ma voiture"],
      ["Khadma ta3i 9addam restaurant italien", "Mon travail est devant un restaurant italien"],
      ["N'ro7 tani l'gym", "Je vais aussi a la salle de sport"],
      ["N'ro7 ki n'ji ml'khadma", "J'y vais quand je rentre du travail"],
    ]),
    createManualLesson("chapter_01_reading_intro_text_c_v1", "Lecture · texte 3", [
      ["F'lil, ana nakoul wa n'chouf tv", "Le soir, je mange et je regarde la tele"],
      ["Routinia ta3i mokhtalfa f lweekend", "Ma routine est differente le week-end"],
      ["Ana n'chouf s7abati", "Je vois mes amies"],
      ["Sa7bati Hadjer t'ji dima retard", "Mon amie Hadjer arrive toujours en retard"],
      ["Bessa7 ma3lich, ana n'7abha", "Mais ce n'est pas grave, je l'aime bien"],
      ["Nhar khmiss nakoul dima f'dar waldiya", "Le jeudi je mange toujours chez mes parents"],
      ["Beba y'tayab ghaya", "Papa cuisine tres bien"],
      ["Yima dima ta7kilna 7kayat chabin", "Maman nous raconte toujours de belles histoires"],
    ]),
    createManualLesson("chapter_01_reading_intro_vocab_v1", "Lecture · vocabulaire", [
      ["Ism", "Nom"],
      ["Yima", "Maman"],
      ["Beba", "Papa"],
      ["Klab", "Chiens"],
      ["9tout", "Chats"],
      ["Mba3d", "Apres"],
      ["9bal", "Avant"],
      ["9addam", "Devant"],
      ["Hnak", "La-bas"],
      ["Tani", "Aussi"],
      ["Oustada", "Enseignante"],
      ["Khadma", "Travail"],
    ]),
    createManualLesson("chapter_01_reading_intro_vocab_b_v1", "Lecture · vocabulaire 2", [
      ["Dima", "Toujours"],
      ["Ma3lich", "Ce n'est pas grave"],
      ["Khmiss", "Jeudi"],
      ["Waldiya", "Mes parents"],
      ["Y'tayab", "Il cuisine"],
      ["7kayat", "Histoires / contes"],
      ["Ki", "Quand"],
      ["Mokhtalaf", "Different"],
      ["Ta7kilna", "Elle nous raconte"],
    ]),
    createManualLesson("chapter_01_reading_intro_questions_v1", "Comprehension · questions", [
      ["Wach houwa ism l'bint?", "Quel est le nom de la fille ?"],
      ["Win taskoun l'bint?", "Ou habite la fille ?"],
      ["Ch7al l'age ta3 khouha?", "Quel est l'age de son frere ?"],
      ["Wach houwa sport favoris ta3ha?", "Quel est son sport favori ?"],
      ["Hiya t'7ab makla italienne?", "Elle aime la nourriture italienne ?"],
      ["Winta hiya t'ro7 la gym?", "Quand va-t-elle a la gym ?"],
      ["Chkoun li y'ji dima retard?", "Qui vient toujours en retard ?"],
      ["Bebaha y'7ab y'tayyab?", "Son pere aime cuisiner ?"],
      ["Yimaha wach dir ki t'ji Nadjet?", "Que fait sa maman quand Nadjet vient ?"],
    ]),
    createManualLesson("chapter_01_reading_intro_new_verbs_a_v1", "Lecture · nouveaux verbes A", [
      ["Na9ra", "Lire / etudier"],
      ["Naghssal", "Laver"],
      ["Narfad", "Porter"],
      ["Narba7", "Gagner"],
      ["Nakhssar", "Perdre"],
      ["Najri", "Courir"],
      ["Nat3alam", "Apprendre"],
      ["Narmi", "Jeter"],
      ["Nalbass", "Porter un vetement"],
      ["Nawssal", "Arriver"],
    ]),
    createManualLesson("chapter_01_reading_intro_new_verbs_b_v1", "Lecture · nouveaux verbes B", [
      ["N'kamal", "Terminer"],
      ["N'wari", "Montrer"],
      ["N'ssaguam", "Reparer / organiser / ranger"],
      ["N'wajab", "Repondre"],
      ["N'khawi", "Vider"],
      ["N'3amar", "Remplir"],
      ["N'3ayat", "Appeler"],
      ["N'sib", "Trouver"],
      ["N'3awad", "Repeter"],
    ]),
    createManualLesson("chapter_01_reading_intro_weekdays_v1", "Jours de la semaine", [
      ["Simana", "Semaine"],
      ["Sabt", "Samedi"],
      ["7ad", "Dimanche"],
      ["Tnin", "Lundi"],
      ["Tlata", "Mardi"],
      ["Larba3", "Mercredi"],
      ["Khmiss", "Jeudi"],
      ["Jam3a", "Vendredi"],
    ]),
  ]),
  createModule("chapter_01_school_v1", "13. Parler d'école et de classe", [
    createManualLesson("chapter_01_school_objectives_v1", "L'madrassa · objectifs", [
      ["Na9ra texte", "Lire les textes"],
      ["Nafham moufradat", "Je comprends le vocabulaire"],
      ["N3awen rou7i bal audio", "Je m'aide avec l'audio"],
    ]),
    createManualLesson("chapter_01_school_text_a_v1", "L'madrassa · texte 1", [
      ["Fal madrassa kayan oustad, moudhir, na2ib moudhir ouw khadamin nadafa", "Dans l'ecole il y a un prof, un directeur, un adjoint et des agents d'entretien"],
      ["Kayan / Kayna / Kaynin", "Il y a"],
      ["Oustad", "Professeur"],
      ["Moudhir", "Directeur"],
      ["Na2ib moudhir", "Adjoint du directeur"],
      ["Khadamin nadafa", "Agents d'entretien"],
    ]),
    createManualLesson("chapter_01_school_text_b_v1", "L'madrassa · texte 2", [
      ["L'mou3alim oula oustad houma y9arouni logha, riyadhiyat, 3ouloum", "Les enseignants m'enseignent la langue, les maths et les sciences"],
      ["Ana n7ab bezaf had mawad", "J'aime beaucoup ces matieres"],
      ["Logha", "Langue"],
      ["Riyadhiyat", "Maths"],
      ["3ouloum", "Sciences"],
      ["Mawad", "Matieres"],
    ]),
    createManualLesson("chapter_01_school_text_c_v1", "L'madrassa · texte 3", [
      ["Ana n'7ab n'ro7 l'madrassa", "J'aime aller a l'ecole"],
      ["Lianou fiha na9der nat3alam bezaf 7wayej", "Parce que j'y peux apprendre beaucoup de choses"],
      ["Na9der na9ra", "Je peux lire"],
      ["Na9dar nat3alam", "Je peux apprendre"],
      ["Na9dar nafham", "Je peux comprendre"],
      ["Tani natla9a m3a s7abi / s7abati", "Et aussi rencontrer mes amis"],
    ]),
    createManualLesson("chapter_01_school_text_d_v1", "L'madrassa · texte 4", [
      ["Ana ki nro7 l'madrassa, nwajed 7wayji 9bal", "Quand je vais a l'ecole, je prepare mes affaires avant"],
      ["Nakhrouj m'dar ouw nadi tre9 l'madrassa", "Je sors de la maison et je prends la route de l'ecole"],
      ["Ki nawssal l'madrassa ana natla9a m3a s7abi", "Quand j'arrive a l'ecole je retrouve mes amis"],
      ["Nahadrou, nada7kou, nal3bou ouw mba3d nadakhlou l'sa7a", "On parle, on rit, on joue, puis on rentre dans la cour"],
      ["N'sanaou jarass ysouni, mba3d mouraha nadakhlou l'9issm", "On attend que la cloche sonne, puis on entre en classe"],
      ["Kayan oustad f'l9issm, kayan saboura, kayan twabel", "Il y a un professeur, un tableau et des tables dans la classe"],
      ["Ki oustad yabda y9ari, ana naskout ouw nrakaz m3ah", "Quand le prof commence a enseigner, je me tais et je me concentre avec lui"],
    ]),
    createManualLesson("chapter_01_school_verbs_v1", "L'madrassa · verbes", [
      ["Nwajed", "Preparer"],
      ["Nakhrouj", "Sortir"],
      ["Nadi", "Prendre"],
      ["Nawssal", "Arriver"],
      ["Nadkhoul", "Rentrer"],
      ["N'sana", "Attendre"],
      ["N'souni", "Sonner"],
      ["Naskout", "Se taire"],
      ["Nabda", "Commencer"],
    ]),
    createManualLesson("chapter_01_school_class_actions_v1", "En classe · actions", [
      ["Narfa3 yadi", "Je leve ma main"],
      ["N3ali yadi", "Je leve ma main"],
      ["Naktab darss", "J'ecris le cours"],
      ["Nkhamem 9bal", "Je reflechis avant"],
      ["Nrakaz", "Je me concentre"],
      ["Nal3ab tani", "Je joue aussi"],
    ]),
    createManualLesson("chapter_01_school_action_examples_v1", "En classe · exemples", [
      ["Narfa3 poids", "Je souleve du poids"],
      ["N3ali rassi", "Je leve ma tete"],
      ["Nakteb braya", "J'ecris une lettre"],
      ["Nakteb CV ta3i", "J'ecris mon CV"],
      ["Nkhamem bezaf fiek", "Je pense beaucoup a toi"],
      ["Nrakaz m3a l'exercice", "Je me concentre avec l'exercice"],
      ["Nal3ab koura", "Je joue au ballon"],
      ["Nal3ab guitara", "Je joue de la guitare"],
    ]),
  ]),
  createModule("chapter_01_aid_v1", "16. Comprendre les fêtes et les visites", [
    createManualLesson("chapter_01_aid_core_v1", "L3id · expressions de base", [
      ["L3id sghir yji mour ramdan", "Le petit Aid vient apres le Ramadan"],
      ["Fi nhar l'3id, ana nro7 nghafer 3aila ta3i wa nchouf 7babi", "Le jour de l'Aid, je rends visite a ma famille et je vois mes proches"],
      ["Fi nhar l3id kayan salat l'3id", "Le jour de l'Aid il y a la priere de l'Aid"],
      ["Nro7 nsali f'ljama3", "Je vais prier a la mosquee"],
      ["Ki nwali nalbass mli7 bach nasta9bal l3aila ta3i ouw 7babi", "Ensuite je m'habille bien pour accueillir ma famille et mes proches"],
      ["Fi l'3id lakbir, kayan kabch lazam nadab7ou", "Pour le grand Aid, il y a le mouton qu'on doit sacrifier"],
      ["Hadi sunna ouw 3ada fal Djazair", "C'est une sunna et une tradition en Algerie"],
    ]),
    createManualLesson("chapter_01_aid_questions_v1", "L3id · questions et reponses", [
      ["Ntouma 3ayadtou? Dba7tou?", "Vous avez fete l'Aid ? Vous avez sacrifie ?"],
      ["7na 3ayadna, 7na dba7na", "Nous avons fete, nous avons sacrifie"],
      ["7na ma 3ayadnach, 7na ma dba7nach", "Nous n'avons pas fete, nous n'avons pas sacrifie"],
      ["Ana nghafer l'ahl ta3i", "Je rends visite a ma famille"],
      ["3idkoum mabrouk", "Aid moubarak a vous"],
    ]),
    createManualLesson("chapter_01_aid_small_text_a_v1", "L3id sghir · texte 1", [
      ["Nhar l3id sghir, nwajed rou7i bach namchi nsali sba7", "Le jour du petit Aid, je me prepare pour aller prier le matin"],
      ["Nalbass 9ach byad ouw nadkhoul lajam3", "Je mets des habits blancs et j'entre a la mosquee"],
      ["Nasma3 khotba, nsali ouw nsalem 3la ness ouw nad3ilhoum", "J'ecoute le sermon, je prie, je salue les gens et je prie pour eux"],
      ["Ki nadkhoul l'dar nsalem 3la 7babi ouw n9olhoum 3idkoum mabrouk", "Quand je rentre a la maison je salue mes proches et je leur dis Aid moubarak"],
    ]),
    createManualLesson("chapter_01_aid_small_text_b_v1", "L3id sghir · texte 2", [
      ["Nachroub 9ahwa m3ahoum ouw nakoul gateau ta3houm", "Je bois le cafe avec eux et je mange leurs gateaux"],
      ["Mba3d nro7 nghafer 7babi ouw nass eli na3rafhoum", "Ensuite je vais rendre visite a mes proches et aux gens que je connais"],
      ["Ki tji tnach, nadkhoul l'dar", "Quand midi arrive, je rentre a la maison"],
      ["Naftar, la3chia ngueyil", "Je dejeune, puis l'apres-midi je fais la sieste"],
      ["Mba3d n3awed nakhrouj nghafer ouw nzour l'ahl ta3i ouw nass eli n7abhoum", "Ensuite je ressors visiter ma famille et les gens que j'aime"],
    ]),
    createManualLesson("chapter_01_aid_small_vocab_v1", "L3id sghir · vocabulaire", [
      ["Byad", "Blanc"],
      ["Khotba", "Le sermon"],
      ["Tnach", "Midi"],
      ["Nsalem", "Saluer"],
      ["Nad3i", "Prier pour / invoquer"],
      ["Nghafer", "Visiter en prenant des nouvelles"],
      ["Naftar", "Manger a midi"],
      ["Ngueyil", "Faire la sieste l'apres-midi"],
    ]),
    createManualLesson("chapter_01_aid_big_text_a_v1", "L3id lkbir · texte 1", [
      ["9bal nhar l3id lkbir, nachri kabch mli7, machi mrid", "Avant le grand Aid, j'achete un bon mouton qui n'est pas malade"],
      ["W nwajdou l'dbi7a nhar l'3id lakbir", "Et on prepare le sacrifice le jour du grand Aid"],
      ["Ki yji nhar l'3id lakbir, nro7 ljama3, nsali, nasma3 khotba", "Quand le grand Aid arrive, je vais a la mosquee, je prie et j'ecoute le sermon"],
      ["W nsalam 3la ness m3aya, nssa9ssi 3lihoum ouw nadi khbarhoum", "Je salue les gens avec moi, je prends de leurs nouvelles"],
      ["Ki nadkhoul l'dar nwajed rou7i l'dbi7a", "Quand je rentre a la maison, je me prepare pour le sacrifice"],
    ]),
    createManualLesson("chapter_01_aid_big_text_b_v1", "L3id lkbir · texte 2", [
      ["N9oul bismillah", "Je dis bismillah"],
      ["Nwajed lkabda ouw ndir malfouf 3la tnach", "Je prepare le foie et je fais des grillades a midi"],
      ["Yab9al l7am, lazam nsad9ou l'mssakin w nass ma7tajja", "Quand il reste de la viande, il faut la donner aux pauvres et aux necessiteux"],
      ["Lianou hadi sunnah ta3 nabi ou 3adda fal djazayer", "Parce que c'est une tradition du Prophete et une coutume en Algerie"],
    ]),
    createManualLesson("chapter_01_aid_big_vocab_v1", "L3id lkbir · vocabulaire", [
      ["Kabch", "Mouton"],
      ["Khrouf", "Mouton"],
      ["Mrid", "Malade"],
      ["Dbi7a", "Le sacrifice"],
      ["Kabda", "Le foie"],
      ["Malfouf", "Grillades"],
      ["L7am", "Viande"],
      ["Nab9a", "Rester"],
      ["Nssada9", "Donner l'aumone"],
      ["Nadba7", "Sacrifier / egorger"],
      ["Nat3acha", "Manger le soir"],
    ]),
    createManualLesson("chapter_01_aid_recap_v1", "L3id · a retenir", [
      ["Nghafer", "Visiter lors des ceremonies"],
      ["Naftar", "Manger a midi"],
      ["Nat3acha", "Manger le soir"],
      ["Nadba7", "Sacrifier / egorger"],
      ["Nad3i", "Invoquer"],
      ["Nssada9", "Donner l'aumone"],
    ]),
  ]),
  createModule("chapter_01_social_expressions_v1", "10. Réagir comme un vrai locuteur", [
    createManualLesson("chapter_01_social_nasta3raf_v1", "Nasta3raf · reconnaitre la valeur", [
      ["Nasta3raf biek", "Je te tire chapeau"],
      ["Nasta3raf biha", "Je lui tire chapeau a elle"],
      ["Ana ma nasta3rafch biek", "Je ne te tire pas chapeau"],
      ["Houma ma yasta3rfouch b had khadma", "Ils ne reconnaissent pas ce travail"],
      ["Nta ma t7abch tasta3raf b les erreurs ta3ek yak?", "Toi tu ne veux pas reconnaitre tes erreurs, n'est-ce pas ?"],
    ]),
    createManualLesson("chapter_01_social_chatr_v1", "Chatr / 9afez · adjectifs", [
      ["Chatr", "Actif / doue"],
      ["Chatra", "Active / douee"],
      ["Chatrin", "Actifs / doues"],
      ["9afez", "Sagace / debrouillard"],
      ["9afeza", "Sagace / debrouillarde"],
      ["9afezin", "Sagaces / debrouillards"],
    ]),
    createManualLesson("chapter_01_social_chatr_phrases_v1", "Chatr / 9afez · phrases", [
      ["Had lbint chatra bezaf", "Cette fille est tres active"],
      ["Had lbint 9afeza bezaf", "Cette fille est tres sagace"],
      ["Lazam tkoun 9afez f had denya", "Il faut que tu sois sagace dans cette vie"],
      ["Kayan chi ness 9afzin bezaf", "Il y a certaines personnes tres sagaces"],
      ["Rani nchouf had lwald yna9i bitou, waldek chatr", "Je vois ton fils nettoyer sa chambre, ton fils est actif"],
    ]),
    createManualLesson("chapter_01_social_nchaj3ek_v1", "Nchaj3ek · encourager", [
      ["Nchaj3ek", "Je t'encourage"],
      ["Nchaj3", "Encourager"],
      ["Ana nchaj3ek f had machrou3", "Je t'encourage dans ce projet"],
      ["Ntia ga3 ma tchaj3inich", "Toi tu ne m'encourages jamais"],
      ["Yallah nchaj3ou l'equipe ta3 football", "Allez, on encourage l'equipe de football"],
    ]),
    createManualLesson("chapter_01_social_condolences_v1", "Condoleances et soutien", [
      ["Rabi m3ek", "Dieu est avec toi"],
      ["Rabi ysabrek", "Que Dieu te donne la patience"],
      ["Nchalah Rabi m3ek", "Inchallah Dieu est avec toi"],
      ["3adama allahou ajrakoum", "Que Dieu augmente votre recompense"],
      ["Ina lilahi wa ina ilayhi raji3oun", "Nous appartenons a Dieu et c'est a Lui que nous retournons"],
    ]),
    createManualLesson("chapter_01_social_ndaber_v1", "Ndaber rassi · se debrouiller", [
      ["Ndaber rassi", "Je me debrouille"],
      ["Ma t7abich tafahmi, daabri rassek", "Tu ne veux pas comprendre, debrouille-toi"],
      ["Khalihoum ydaabrou rasshoum", "Laisse-les se debrouiller"],
    ]),
    createManualLesson("chapter_01_social_rassek_v1", "Ma tkasserch rassek · ne te casse pas la tete", [
      ["Ma tkasserch rassek", "Ne te casse pas la tete"],
      ["Ma taghbanch rou7ek", "Ne te derange pas"],
      ["Khali 3liek, ma tkasserch rassek", "Laisse tomber, ne te casse pas la tete"],
      ["Wa3lach rahoum yaghabnou fi rou7houm haka?", "Pourquoi ils se derangent comme ca ?"],
      ["Njiblek draham? La, ma taghabnich rou7ek", "Je te ramene de l'argent ? Non, ne te derange pas"],
    ]),
    createManualLesson("chapter_01_social_drabnah_v1", "Drab na7 · ne fais pas cas", [
      ["Drab na7", "Ne fais pas cas"],
      ["Chouft wach 9alli? Wah, drab na7", "Tu as vu ce qu'il m'a dit ? Oui, ne fais pas cas"],
      ["Rahoum yadarbou na7", "Ils ne font pas cas"],
      ["Nkasser", "Casser"],
      ["Naghban", "Rendre la tache difficile / deranger"],
      ["Na7", "Heurtoir de porte"],
    ]),
  ]),
  createModule("chapter_02_verbs_v1", "03. Booster tes verbes utiles", [
    createManualLesson("chapter_02_verbs_intro_v1", "Darss 01 · af3al djazairia", [
      ["Darss 01", "Lecon 01"],
      ["Af3al djazairia", "Verbes algeriens"],
      ["Fiche de revision", "Fiche de revision"],
    ]),
    createManualLesson("chapter_02_verbs_na_v1", "Verbes (NA)", [
      ["Nachri", "Acheter"],
      ["Namchi", "Partir"],
      ["Nalbass", "Porter un vetement"],
      ["Nar9oud", "Dormir"],
      ["Nabni", "Construire"],
    ]),
    createManualLesson("chapter_02_verbs_n_v1", "Verbes (N)", [
      ["N'sali", "Prier"],
      ["N'3ayat", "Appeler"],
      ["N'sou9", "Conduire"],
      ["N'9oul", "Dire"],
      ["N'koun", "Etre au futur"],
    ]),
  ]),
];

const moduleOrder = [
  "foundations_v2",
  "daily_life_v2",
  "chapter_02_verbs_v1",
  "grammar_descriptions_v2",
  "chapter_01_demonstratives_v1",
  "chapter_01_possessive_v1",
  "chapter_01_translation_v1",
  "chapter_01_translation_2_v1",
  "chapter_01_key_expressions_v2",
  "chapter_01_social_expressions_v1",
  "chapter_01_family_v1",
  "chapter_01_reading_intro_v1",
  "chapter_01_school_v1",
  "chapter_01_nature_climate_v1",
  "chapter_01_trip_v1",
  "chapter_01_aid_v1",
  "chapter_01_bila_houdoud_v1",
  "chapter_01_babylone_v1",
  "nature_extension_v2",
] as const;

const moduleOrderIndex = new Map<string, number>(moduleOrder.map((id, index) => [id, index]));

export const modules: LegacyModule[] = [...learningModules].sort((left, right) => {
  const leftIndex = moduleOrderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = moduleOrderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
  return leftIndex - rightIndex;
});
export const lessons: LegacyLesson[] = modules.flatMap((module) => module.lessons);



