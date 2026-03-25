import type { WordEntry } from "../types/learning";

type WordSeed = readonly [
  dz: string,
  fr: string,
  type: WordEntry["type"],
  frequencyScore: number,
  example: string,
];

const normalizeText = (value: string) => value.trim().toLowerCase();

const hash = (value: string) => {
  let hashA = 0x811c9dc5;
  let hashB = 0x9e3779b1;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    hashA ^= code;
    hashA = Math.imul(hashA, 0x01000193) >>> 0;

    hashB ^= code;
    hashB = Math.imul(hashB, 0x85ebca6b) >>> 0;
  }

  return `${hashA.toString(16).padStart(8, "0")}${hashB.toString(16).padStart(8, "0")}`;
};

export const generateWordId = (dz: string, fr: string): string => {
  const normalizedDz = normalizeText(dz);
  const normalizedFr = normalizeText(fr);
  return hash(`${normalizedDz}|${normalizedFr}`);
};

const seeds: WordSeed[] = [
  ["salam", "salut", "word", 1.0, "salam kho"],
  ["saha", "bonjour", "word", 0.99, "saha labas"],
  ["labas", "ca va", "word", 0.99, "labas 3lik"],
  ["rak", "tu es", "word", 0.98, "rak mlih"],
  ["marhba", "bienvenue", "word", 0.97, "marhba bik"],
  ["bslama", "au revoir", "word", 0.97, "roh bslama"],
  ["sbah lkhir", "bonjour le matin", "expression", 0.96, "sbah lkhir 3lik"],
  ["masa lkhir", "bonsoir", "expression", 0.95, "masa lkhir khouya"],
  ["wesh rak", "comment tu vas", "expression", 0.98, "wesh rak lyoum"],
  ["labes 3lik", "tout va bien chez toi", "expression", 0.95, "labes 3lik inchallah"],

  ["ana", "moi", "word", 0.98, "ana hna"],
  ["nta", "toi", "word", 0.97, "nta sahbi"],
  ["nti", "toi (feminin)", "word", 0.96, "nti hna"],
  ["hada", "ceci", "word", 0.95, "hada mlih"],
  ["hadi", "celle-ci", "word", 0.95, "hadi benti"],
  ["hna", "ici", "word", 0.94, "hna f dar"],
  ["tmak", "la-bas", "word", 0.93, "roh tmak"],
  ["walo", "rien", "word", 0.94, "walo ma bark"],
  ["kayn", "il y a", "word", 0.96, "kayn ma"],
  ["ga3", "du tout", "word", 0.93, "ma kayench ga3"],

  ["dir", "faire", "word", 0.98, "dir haka"],
  ["roh", "aller", "word", 0.98, "roh t9ra"],
  ["ji", "venir", "word", 0.98, "ji hna"],
  ["chouf", "regarder", "word", 0.97, "chouf bark"],
  ["kl", "manger", "word", 0.96, "kl khobz"],
  ["chrab", "boire", "word", 0.96, "chrab ma"],
  ["khoud", "prendre", "word", 0.95, "khoud wahed"],
  ["hab", "vouloir", "word", 0.96, "hab nroh"],
  ["sem3", "ecouter", "word", 0.94, "sem3 lia"],
  ["9ra", "etudier", "word", 0.93, "9ra bark"],

  ["ih", "oui", "word", 0.95, "ih sah"],
  ["la", "non", "word", 0.95, "la mazal"],
  ["normal", "normal", "word", 0.92, "hada normal"],
  ["mlih", "bien", "word", 0.95, "mlih bezaf"],
  ["safi", "c'est bon", "word", 0.94, "safi khlass"],
  ["mazal", "pas encore", "word", 0.93, "mazal ma jit"],
  ["baraka", "stop", "word", 0.92, "baraka men hadra"],
  ["3adi", "ce n'est pas grave", "word", 0.92, "3adi sra"],
  ["yaaani", "genre", "word", 0.9, "yaaani hakda"],
  ["sahit", "bien joue", "word", 0.91, "sahit 3lik"],

  ["chhal", "combien", "word", 0.9, "chhal hada"],
  ["win", "ou", "word", 0.89, "win rak"],
  ["wach", "quoi", "word", 0.9, "wach bark"],
  ["kifech", "comment", "word", 0.89, "kifech dir"],
  ["wa9tach", "quand", "word", 0.87, "wa9tach tji"],
  ["shkun", "qui", "word", 0.86, "shkun hada"],
  ["3lah", "pourquoi", "word", 0.86, "3lah hakda"],
  ["menin", "d'ou", "word", 0.84, "menin nta"],
  ["achnou", "qu'est-ce que", "word", 0.85, "achnou hadchi"],
  ["fin", "ou exactement", "word", 0.84, "fin blassa"],

  ["eyh", "d'accord", "word", 0.83, "eyh bark"],
  ["sah", "c'est vrai", "word", 0.84, "sah bark"],
  ["machi", "ce n'est pas", "word", 0.84, "machi hada"],
  ["ymken", "peut-etre", "word", 0.8, "ymken ghedwa"],
  ["tab3an", "bien sur", "word", 0.81, "tab3an nji"],
  ["mouhime", "bref", "word", 0.78, "mouhime khlass"],
  ["khir", "bien", "word", 0.79, "kolchi khir"],
  ["hakka", "comme ca", "word", 0.8, "dirha hakka"],
  ["machi hakda", "pas comme ca", "expression", 0.8, "machi hakda kho"],
  ["balak", "fais attention", "word", 0.82, "balak men tri9"],

  ["lyoum", "aujourd'hui", "word", 0.88, "lyoum nji"],
  ["ghedwa", "demain", "word", 0.87, "ghedwa nchouf"],
  ["daba", "maintenant", "word", 0.89, "daba nroh"],
  ["barah", "hier", "word", 0.79, "barah jit"],
  ["sbah", "matin", "word", 0.81, "sbah bark"],
  ["bel3chi", "soir", "word", 0.78, "bel3chi nbark"],
  ["kol youm", "chaque jour", "expression", 0.85, "kol youm nkhdem"],
  ["derk", "tout de suite", "word", 0.86, "derk nji"],
  ["ba3d chwya", "dans un moment", "expression", 0.8, "ba3d chwya nroh"],
  ["dima", "toujours", "word", 0.83, "dima hakda"],

  ["wahed", "un", "word", 0.85, "wahed khobza"],
  ["zouj", "deux", "word", 0.84, "zouj bark"],
  ["tlata", "trois", "word", 0.82, "tlata bark"],
  ["rb3a", "quatre", "word", 0.79, "rb3a bark"],
  ["khamsa", "cinq", "word", 0.78, "khamsa bark"],
  ["bezaf", "beaucoup", "word", 0.88, "bezaf bark"],
  ["chwya", "un peu", "word", 0.86, "chwya bark"],
  ["kamel", "entier", "word", 0.78, "kamel nhar"],
  ["noss", "moitie", "word", 0.74, "noss kilo"],
  ["9lil", "peu", "word", 0.77, "9lil bark"],

  ["ghali", "cher", "word", 0.78, "hada ghali"],
  ["rkhis", "pas cher", "word", 0.78, "hada rkhis"],
  ["zid", "ajoute", "word", 0.76, "zid wahed"],
  ["n9es", "diminue", "word", 0.74, "n9es chwya"],
  ["sou9", "marche", "word", 0.72, "roh l sou9"],
  ["kilo", "kilo", "word", 0.73, "kilo batata"],
  ["mizan", "balance", "word", 0.68, "7ot f mizan"],
  ["khallas", "payer", "word", 0.74, "khallas bark"],
  ["sarf", "monnaie", "word", 0.67, "3andek sarf"],
  ["mesrouf", "argent de poche", "word", 0.65, "mesrouf ta3 nhar"],

  ["taxi", "taxi", "word", 0.77, "nroh b taxi"],
  ["bus", "bus", "word", 0.75, "bus wa9ef"],
  ["tram", "tramway", "word", 0.72, "tram mli7"],
  ["station", "station", "word", 0.71, "station tmak"],
  ["wa9ef", "arrete", "word", 0.73, "wa9ef hna"],
  ["tri9", "route", "word", 0.76, "tri9 twila"],
  ["wsel", "arriver", "word", 0.74, "ki wsel"],
  ["hbess", "arreter", "word", 0.7, "hbess hna"],
  ["blassa", "place", "word", 0.68, "ma kayench blassa"],
  ["course", "trajet", "word", 0.66, "course ta3 taxi"],

  ["yemma", "maman", "word", 0.76, "yemma hna"],
  ["kho", "frere", "word", 0.75, "kho kbir"],
  ["khti", "soeur", "word", 0.74, "khti sghira"],
  ["dar", "maison", "word", 0.78, "dar kbira"],
  ["bit", "chambre", "word", 0.64, "bit n3as"],
  ["couzina", "cuisine", "word", 0.62, "couzina ndifa"],
  ["salon", "salon", "word", 0.61, "salon bark"],
  ["bab", "porte", "word", 0.67, "7ell bab"],
  ["shbbaak", "fenetre", "word", 0.6, "sedd shbbaak"],
  ["welad", "enfants", "word", 0.72, "welad bark"],

  ["khobz", "pain", "word", 0.78, "khobz bark"],
  ["ma", "eau", "word", 0.8, "ma bark"],
  ["atay", "the", "word", 0.68, "atay bark"],
  ["lham", "viande", "word", 0.67, "lham bark"],
  ["djej", "poulet", "word", 0.69, "djej bark"],
  ["batata", "pomme de terre", "word", 0.66, "batata bark"],
  ["tuffah", "pomme", "word", 0.58, "tuffah bark"],
  ["7lib", "lait", "word", 0.65, "7lib bark"],
  ["kesra", "galette", "word", 0.64, "kesra bark"],
  ["chorba", "soupe", "word", 0.63, "chorba bark"],

  ["ya kho", "mon frere", "expression", 0.67, "ya kho bark"],
  ["saha lik", "bravo a toi", "expression", 0.66, "saha lik 3la bark"],
  ["bssa7tek", "profites-en", "expression", 0.66, "bssa7tek lmakla"],
  ["tfaddal", "vas-y je t'en prie", "word", 0.64, "tfaddal odkhol"],
  ["rabi ykhalik", "que Dieu te garde", "expression", 0.62, "rabi ykhalik lya"],
  ["mabrouk", "felicitations", "word", 0.63, "mabrouk bark"],
  ["inchallah", "si Dieu veut", "word", 0.67, "inchallah ghedwa"],
  ["allah ghaleb", "on n'y peut rien", "expression", 0.61, "allah ghaleb bark bark"],
  ["ma3andich", "je n'ai pas", "word", 0.65, "ma3andich waqt"],
  ["mazelni", "je suis encore", "word", 0.6, "mazelni hna"],

  ["ya latif", "oh mon Dieu", "expression", 0.61, "ya latif bark"],
  ["ya hasra", "quel regret", "expression", 0.58, "ya hasra 3la dik lyam"],
  ["ferhan", "content", "word", 0.58, "ana ferhan"],
  ["qal9an", "inquiete", "word", 0.56, "nti qal9an"],
  ["m9elle9", "stressé", "word", 0.57, "rani m9elle9"],
  ["za3fan", "fache", "word", 0.58, "rah za3fan"],
  ["meskin", "pauvre type", "word", 0.54, "meskin ma 3rafch"],
  ["khayef", "apeure", "word", 0.55, "ana khayef"],
  ["mstanees", "a l'aise", "word", 0.53, "rani mstanees m3ak"],
  ["mharres", "epuise", "word", 0.52, "rani mharres"],

  ["bezaf bezaf", "vraiment beaucoup", "expression", 0.56, "bark bezaf bezaf"],
  ["men bekri", "depuis longtemps", "expression", 0.54, "bark men bekri"],
  ["3la khater", "parce que", "expression", 0.57, "ma jitsh 3la khater tri9"],
  ["fi bali", "dans ma tete", "expression", 0.53, "fi bali blli yji"],
  ["3yit", "j'en ai marre", "word", 0.55, "3yit men hadchi"],
  ["mazel kayen", "il en reste encore", "expression", 0.52, "mazel kayen waqt"],
  ["7abess rouhi", "je me retiens", "expression", 0.5, "7abess rouhi men dhak"],
  ["9albi m3ammar", "j'ai le coeur plein", "expression", 0.5, "9albi m3ammar far7a"],
  ["ma fihach", "pas de souci", "expression", 0.51, "ma fihach mushkil"],
  ["rassi dar", "j'ai la tete qui tourne", "expression", 0.5, "rassi dar men stress"],

  ["chwiya chwiya", "doucement", "expression", 0.54, "chwiya chwiya 3liya"],
  ["bser3a", "vite", "word", 0.57, "ji bser3a"],
  ["ga3 ga3", "absolument pas", "expression", 0.51, "ma nji ga3 ga3"],
  ["kima ygolou", "comme on dit", "expression", 0.5, "kima ygolou bark"],
  ["3la lekher", "au maximum", "expression", 0.55, "khdem 3la lekher"],
  ["9wi", "fort", "word", 0.56, "hada 9wi"],
  ["b nett", "franchement", "expression", 0.52, "b nett ma 3jbnich"],
  ["7abba 7abba", "petit a petit", "expression", 0.53, "7abba 7abba bark"],
  ["sa7 sa7", "vraiment", "expression", 0.51, "sa7 sa7 mlih"],
  ["bzzaf 3lih", "trop pour lui", "expression", 0.5, "hada bzzaf 3lih"],

  ["bessah", "mais", "word", 0.68, "bessah ma 3labalich"],
  ["walakin", "cependant", "word", 0.67, "walakin bark"],
  ["hit", "parce que", "word", 0.63, "ma jitsh hit mared"],
  ["donk", "donc", "word", 0.6, "donk nroh"],
  ["mba3d", "ensuite", "word", 0.61, "mba3d nchouf"],
  ["hata", "meme", "word", 0.6, "hata nta"],
  ["wala", "ou bien", "word", 0.62, "cafe wala atay"],
  ["ila", "si", "word", 0.59, "ila jit bark"],
  ["3la jal", "pour", "expression", 0.58, "3la jal hadchi"],
  ["w", "et", "word", 0.66, "ana w nta"],

  ["ma nhebch", "je n'aime pas", "expression", 0.62, "ma nhebch lkeddab"],
  ["ma fhemtch", "je n'ai pas compris", "expression", 0.67, "ma fhemtch kifech"],
  ["ma kayench", "il n'y a pas", "expression", 0.61, "ma kayench ma"],
  ["mazel ma", "pas encore", "expression", 0.6, "mazel ma khlasset"],
  ["ma qultch", "je n'ai pas dit", "expression", 0.55, "ma qultch haka"],
  ["ma jitch", "je ne suis pas venu", "expression", 0.57, "ma jitch barah"],
  ["ma bghitch", "je n'ai pas voulu", "expression", 0.55, "ma bghitch ndirha"],
  ["ma 3raftch", "je n'ai pas su", "expression", 0.56, "ma 3raftch nbark"],
  ["ma ndirch", "je ne fais pas", "expression", 0.54, "ma ndirch haka"],
  ["ma nshoufch", "je ne vois pas", "expression", 0.54, "ma nshoufch bark"],

  ["rani", "je suis", "word", 0.68, "rani hna"],
  ["rah", "il est", "word", 0.65, "rah mlih"],
  ["raha", "elle est", "word", 0.63, "raha hna"],
  ["rakom", "vous etes", "word", 0.57, "rakom labas"],
  ["rana", "nous sommes", "word", 0.6, "rana wajdin"],
  ["rahoum", "ils sont", "word", 0.56, "rahoum tmak"],
  ["kount", "j'etais", "word", 0.55, "kount hna"],
  ["kan", "il etait", "word", 0.54, "kan bark"],
  ["y9dar", "il peut", "word", 0.58, "y9dar yji"],
  ["n9dar", "je peux", "word", 0.6, "n9dar ndirha"],

  ["flex", "se la raconter", "word", 0.46, "ma tflexich"],
  ["sahbi", "mon pote", "word", 0.63, "sahbi bark"],
  ["grave", "serieux", "word", 0.48, "grave mlih"],
  ["delire", "ambiance folle", "word", 0.44, "hada delire"],
  ["top", "excellent", "word", 0.47, "hada top"],
  ["mdr", "mort de rire", "word", 0.41, "mdr 3la had l9issa"],
  ["khorti", "n'importe quoi", "word", 0.49, "hada khorti"],
  ["3yan", "galere", "word", 0.43, "nhar 3yan"],
  ["styla", "stylé", "word", 0.45, "look ta3ek styla"],
  ["bomba", "incroyable", "word", 0.44, "makla bomba"],

  ["wach rak labas", "comment tu vas vraiment", "expression", 0.56, "wach rak labas lyoum"],
  ["ana rani hna", "moi je suis ici", "expression", 0.55, "ana rani hna nestenna"],
  ["roh jib ma", "va chercher de l'eau", "expression", 0.53, "roh jib ma bser3a"],
  ["ji hna chwya", "viens ici un peu", "expression", 0.54, "ji hna chwya kho"],
  ["chhal hadchi", "combien ca coute", "expression", 0.55, "chhal hadchi khouya"],
  ["win rak t9ra", "ou est-ce que tu etudies", "expression", 0.48, "win rak t9ra daba"],
  ["daba nji", "je viens maintenant", "expression", 0.52, "daba nji ma bark"],
  ["ma fhemtch kifech", "je n'ai pas compris comment", "expression", 0.51, "ma fhemtch kifech dir"],
  ["khalliha hna", "laisse-la ici", "expression", 0.49, "khalliha hna bark"],
  ["rana m3ak", "nous sommes avec toi", "expression", 0.5, "rana m3ak bark"],

  ["rani n9esser bark", "je rigole seulement", "expression", 0.42, "rani n9esser bark ma bark3bark"],
  ["ya kho nta film", "frere tu es un personnage", "expression", 0.39, "ya kho nta film sa7"],
  ["tji mlih 3la rohek", "tu te prends pour quelqu'un", "expression", 0.37, "tji mlih 3la rohek bark"],
  ["dahaktni bezaf", "tu m'as fait trop rire", "expression", 0.44, "dahaktni bezaf wallah"],
  ["hadi tebki w tdhak", "c'est a pleurer et a rire", "expression", 0.35, "hadi tebki w tdhak sa7"],
  ["ma t9al9nich ana comedian", "ne me stresse pas je suis un comique", "expression", 0.33, "ma t9al9nich ana comedian bark"],
  ["rak tkhammem b kerchek", "tu penses avec ton ventre", "expression", 0.34, "rak tkhammem b kerchek bark"],
  ["dirha b derja", "dis-le en darja", "expression", 0.36, "dirha b derja bark"],
  ["ma tzidch t7chemna", "n'en rajoute pas tu nous fais honte", "expression", 0.32, "ma tzidch t7chemna bark bark"],
  ["nta wa3er fel hadra", "tu es fort en paroles", "expression", 0.38, "nta wa3er fel hadra bark"],

  ["ma tfhemnich ghalet", "ne me comprends pas de travers", "expression", 0.41, "ma tfhemnich ghalet smahli"],
  ["khallini nhder", "laisse-moi parler", "expression", 0.46, "khallini nhder chwya"],
  ["hada machi manti9", "ca n'est pas logique", "expression", 0.43, "hada machi manti9 ga3"],
  ["nta ghalet f had nokta", "tu as tort sur ce point", "expression", 0.39, "nta ghalet f had nokta bark"],
  ["ma netfehmouch hakda", "on ne se comprend pas comme ca", "expression", 0.37, "ma netfehmouch hakda sah"],
  ["sma3ni mlih", "ecoute-moi bien", "expression", 0.44, "sma3ni mlih bark bark"],
  ["rana nhadrou b hdou", "on parle calmement", "expression", 0.36, "rana nhadrou b hdou aujourd'hui"],
  ["ma tkebberhach", "n'en fais pas trop", "expression", 0.35, "ma tkebberhach 3la bark"],
  ["rani njawb bel dalil", "je reponds avec une preuve", "expression", 0.31, "rani njawb bel dalil bark bark"],
  ["ma tbeddelch lhadra", "ne change pas de sujet", "expression", 0.34, "ma tbeddelch lhadra daba"],

  ["tfaddal odkhol", "entre je t'en prie", "expression", 0.45, "tfaddal odkhol marhba"],
  ["saha ftourek", "bon appetit pour la rupture du jeune", "expression", 0.33, "saha ftourek kho"],
  ["rabi ybarek fik", "que Dieu te benisse", "expression", 0.4, "rabi ybarek fik bark"],
  ["wesh khbar dar", "quelles nouvelles de la maison", "expression", 0.34, "wesh khbar dar 3andkom"],
  ["nchoufek mba3d", "je te vois plus tard", "expression", 0.42, "nchoufek mba3d inchallah"],
  ["dir niya m3a la3bad", "aie de bonnes intentions avec les gens", "expression", 0.31, "dir niya m3a la3bad dima"],
  ["marhba bik f darna", "bienvenue chez nous", "expression", 0.39, "marhba bik f darna khouya"],
  ["kima t7eb", "comme tu veux", "expression", 0.43, "dirha kima t7eb"],
  ["khoud rahtak", "mets-toi a l'aise", "expression", 0.41, "khoud rahtak hna"],
  ["sellem 3la yemmak", "passe le bonjour a ta mere", "expression", 0.35, "sellem 3la yemmak ki tbark"],
];

const dedupedWordBank = new Map<string, WordEntry>();

for (const [rawDz, rawFr, type, frequencyScore, example] of seeds) {
  const dz = normalizeText(rawDz);
  const fr = normalizeText(rawFr);

  if (!dz || !fr) {
    continue;
  }

  const key = `${dz}|${fr}`;
  if (dedupedWordBank.has(key)) {
    continue;
  }

  dedupedWordBank.set(key, {
    id: generateWordId(dz, fr),
    dz,
    fr,
    type,
    frequencyScore,
    examples: [example.trim()],
  });
}

export const wordBank: WordEntry[] = Array.from(dedupedWordBank.values());

