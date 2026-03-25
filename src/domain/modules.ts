import { wordBank } from "./wordBank";
import type { Module, SubModule, SubModuleItem } from "../types/learning";

export const modules: Module[] = [
  {
    id: "module_survie",
    name: "Survie",
    description: "Les mots les plus frequents pour saluer, reagir et agir vite.",
    order: 1,
  },
  {
    id: "module_interaction_quotidienne",
    name: "Interaction quotidienne",
    description: "Poser des questions, repondre, situer le temps et compter.",
    order: 2,
  },
  {
    id: "module_situations_reelles",
    name: "Situations reelles",
    description: "Tenir dans les echanges du marche, du transport, de la maison et de la nourriture.",
    order: 3,
  },
  {
    id: "module_expressions_naturelles",
    name: "Expressions naturelles",
    description: "Parler plus comme dans la vraie vie avec des reactions et des tournures naturelles.",
    order: 4,
  },
  {
    id: "module_comprehension_avancee",
    name: "Comprehension avancee",
    description: "Suivre des phrases plus denses, la negation, les connecteurs et l'argot courant.",
    order: 5,
  },
  {
    id: "module_immersion_culturelle",
    name: "Immersion culturelle",
    description: "Phrases completes, humour, debat et interaction sociale reelle.",
    order: 6,
  },
];

export const subModules: SubModule[] = [
  { id: "survie_salutations_social", moduleId: "module_survie", name: "Salutations & social", order: 1 },
  { id: "survie_mots_essentiels", moduleId: "module_survie", name: "Mots essentiels", order: 2 },
  { id: "survie_verbes_base", moduleId: "module_survie", name: "Verbes de base", order: 3 },
  { id: "survie_reactions", moduleId: "module_survie", name: "Reactions", order: 4 },

  { id: "interaction_questions", moduleId: "module_interaction_quotidienne", name: "Questions", order: 1 },
  { id: "interaction_reponses_simples", moduleId: "module_interaction_quotidienne", name: "Reponses simples", order: 2 },
  { id: "interaction_temps_frequence", moduleId: "module_interaction_quotidienne", name: "Temps & frequence", order: 3 },
  { id: "interaction_nombres_quantites", moduleId: "module_interaction_quotidienne", name: "Nombres & quantites", order: 4 },

  { id: "situations_marche", moduleId: "module_situations_reelles", name: "Marche", order: 1 },
  { id: "situations_transport", moduleId: "module_situations_reelles", name: "Transport", order: 2 },
  { id: "situations_maison_famille", moduleId: "module_situations_reelles", name: "Maison & famille", order: 3 },
  { id: "situations_nourriture", moduleId: "module_situations_reelles", name: "Nourriture", order: 4 },

  { id: "expressions_courantes", moduleId: "module_expressions_naturelles", name: "Expressions courantes", order: 1 },
  { id: "expressions_emotions", moduleId: "module_expressions_naturelles", name: "Emotions", order: 2 },
  { id: "expressions_imagees", moduleId: "module_expressions_naturelles", name: "Expressions imagees", order: 3 },
  { id: "expressions_intensite", moduleId: "module_expressions_naturelles", name: "Intensite", order: 4 },

  { id: "avance_connecteurs", moduleId: "module_comprehension_avancee", name: "Connecteurs", order: 1 },
  { id: "avance_negation", moduleId: "module_comprehension_avancee", name: "Negation", order: 2 },
  { id: "avance_structures_verbales", moduleId: "module_comprehension_avancee", name: "Structures verbales", order: 3 },
  { id: "avance_argot_moderne", moduleId: "module_comprehension_avancee", name: "Argot moderne", order: 4 },

  { id: "immersion_phrases_reelles", moduleId: "module_immersion_culturelle", name: "Phrases reelles", order: 1 },
  { id: "immersion_humour", moduleId: "module_immersion_culturelle", name: "Humour", order: 2 },
  { id: "immersion_conflit_debat", moduleId: "module_immersion_culturelle", name: "Conflit / debat", order: 3 },
  { id: "immersion_interaction_sociale", moduleId: "module_immersion_culturelle", name: "Interaction sociale", order: 4 },
];

const subModuleWordKeys: Record<string, string[]> = {
  survie_salutations_social: ["salam", "saha", "labas", "rak", "marhba", "bslama", "sbah lkhir", "masa lkhir", "wesh rak", "labes 3lik"],
  survie_mots_essentiels: ["ana", "nta", "nti", "hada", "hadi", "hna", "tmak", "walo", "kayn", "ga3"],
  survie_verbes_base: ["dir", "roh", "ji", "chouf", "kl", "chrab", "khoud", "hab", "sem3", "9ra"],
  survie_reactions: ["ih", "la", "normal", "mlih", "safi", "mazal", "baraka", "3adi", "yaaani", "sahit"],

  interaction_questions: ["chhal", "win", "wach", "kifech", "wa9tach", "shkun", "3lah", "menin", "achnou", "fin"],
  interaction_reponses_simples: ["eyh", "sah", "machi", "ymken", "tab3an", "mouhime", "khir", "hakka", "machi hakda", "balak"],
  interaction_temps_frequence: ["lyoum", "ghedwa", "daba", "barah", "sbah", "bel3chi", "kol youm", "derk", "ba3d chwya", "dima"],
  interaction_nombres_quantites: ["wahed", "zouj", "tlata", "rb3a", "khamsa", "bezaf", "chwya", "kamel", "noss", "9lil"],

  situations_marche: ["ghali", "rkhis", "zid", "n9es", "sou9", "kilo", "mizan", "khallas", "sarf", "mesrouf"],
  situations_transport: ["taxi", "bus", "tram", "station", "wa9ef", "tri9", "wsel", "hbess", "blassa", "course"],
  situations_maison_famille: ["yemma", "kho", "khti", "dar", "bit", "couzina", "salon", "bab", "shbbaak", "welad"],
  situations_nourriture: ["khobz", "ma", "atay", "lham", "djej", "batata", "tuffah", "7lib", "kesra", "chorba"],

  expressions_courantes: ["ya kho", "saha lik", "bssa7tek", "tfaddal", "rabi ykhalik", "mabrouk", "inchallah", "allah ghaleb", "ma3andich", "mazelni"],
  expressions_emotions: ["ya latif", "ya hasra", "ferhan", "qal9an", "m9elle9", "za3fan", "meskin", "khayef", "mstanees", "mharres"],
  expressions_imagees: ["bezaf bezaf", "men bekri", "3la khater", "fi bali", "3yit", "mazel kayen", "7abess rouhi", "9albi m3ammar", "ma fihach", "rassi dar"],
  expressions_intensite: ["chwiya chwiya", "bser3a", "ga3 ga3", "kima ygolou", "3la lekher", "9wi", "b nett", "7abba 7abba", "sa7 sa7", "bzzaf 3lih"],

  avance_connecteurs: ["bessah", "walakin", "hit", "donk", "mba3d", "hata", "wala", "ila", "3la jal", "w"],
  avance_negation: ["ma nhebch", "ma fhemtch", "ma kayench", "mazel ma", "ma qultch", "ma jitch", "ma bghitch", "ma 3raftch", "ma ndirch", "ma nshoufch"],
  avance_structures_verbales: ["rani", "rah", "raha", "rakom", "rana", "rahoum", "kount", "kan", "y9dar", "n9dar"],
  avance_argot_moderne: ["flex", "sahbi", "grave", "delire", "top", "mdr", "khorti", "3yan", "styla", "bomba"],

  immersion_phrases_reelles: ["wach rak labas", "ana rani hna", "roh jib ma", "ji hna chwya", "chhal hadchi", "win rak t9ra", "daba nji", "ma fhemtch kifech", "khalliha hna", "rana m3ak"],
  immersion_humour: ["rani n9esser bark", "ya kho nta film", "tji mlih 3la rohek", "dahaktni bezaf", "hadi tebki w tdhak", "ma t9al9nich ana comedian", "rak tkhammem b kerchek", "dirha b derja", "ma tzidch t7chemna", "nta wa3er fel hadra"],
  immersion_conflit_debat: ["ma tfhemnich ghalet", "khallini nhder", "hada machi manti9", "nta ghalet f had nokta", "ma netfehmouch hakda", "sma3ni mlih", "rana nhadrou b hdou", "ma tkebberhach", "rani njawb bel dalil", "ma tbeddelch lhadra"],
  immersion_interaction_sociale: ["tfaddal odkhol", "saha ftourek", "rabi ybarek fik", "wesh khbar dar", "nchoufek mba3d", "dir niya m3a la3bad", "marhba bik f darna", "kima t7eb", "khoud rahtak", "sellem 3la yemmak"],
};

const wordIdByDz = new Map(wordBank.map((word) => [word.dz, word.id]));

export const subModuleItems: SubModuleItem[] = subModules.flatMap((subModule) =>
  (subModuleWordKeys[subModule.id] ?? []).map((dz, index) => {
    const wordId = wordIdByDz.get(dz);

    if (!wordId) {
      throw new Error(`Mot introuvable dans wordBank: ${dz}`);
    }

    return {
      id: `${subModule.id}:${wordId}`,
      subModuleId: subModule.id,
      wordId,
      order: index + 1,
    } satisfies SubModuleItem;
  }),
);

export const getWordIdsForSubModule = (subModuleId: string): string[] =>
  subModuleItems
    .filter((item) => item.subModuleId === subModuleId)
    .sort((left, right) => left.order - right.order)
    .map((item) => item.wordId);

export const getSubModulesForModule = (moduleId: string): SubModule[] =>
  subModules
    .filter((subModule) => subModule.moduleId === moduleId)
    .sort((left, right) => left.order - right.order);

const moduleById = new Map(modules.map((module) => [module.id, module]));
const subModuleById = new Map(subModules.map((subModule) => [subModule.id, subModule]));

export const getModuleForSubModule = (subModuleId: string): Module | null => {
  const subModule = subModuleById.get(subModuleId);
  return subModule ? moduleById.get(subModule.moduleId) ?? null : null;
};
