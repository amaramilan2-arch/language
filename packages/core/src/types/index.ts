/**
 * Modèle de domaine de Polyglotte.
 *
 * Principe directeur : le contenu (ce qu'on apprend) et la progression (où en est
 * l'apprenant) sont deux mondes séparés. Le contenu est immuable et versionné ;
 * la progression est locale et lui fait référence par identifiant stable.
 * On peut donc mettre à jour un pack de contenu sans jamais perdre la mémoire de
 * l'utilisateur.
 */

/** Langues cibles. Codes ISO 639 ; `aeb` = arabe tunisien (derja), ISO 639-3. */
export const LANGUAGES = ['en', 'es', 'aeb', 'it'] as const;
export type LanguageCode = (typeof LANGUAGES)[number];

/** La langue source est toujours le français : le public visé est francophone. */
export type SourceLanguage = 'fr';

export interface LanguageProfile {
  code: LanguageCode;
  /** Nom affiché en français. */
  name: string;
  flag: string;
  /** Sens d'écriture, pour la mise en page. */
  direction: 'ltr' | 'rtl';
  /** Étiquette BCP-47 pour la synthèse et la reconnaissance vocale. */
  bcp47: string;
  /**
   * Vrai si la langue dispose d'un support natif fiable pour la synthèse vocale
   * dans les navigateurs. Faux pour l'arabe tunisien : aucune voix n'existe, on
   * bascule alors sur de l'audio enregistré (voir `docs/ARCHITECTURE.md`).
   */
  hasNativeTts: boolean;
  /** Idem pour la reconnaissance vocale (Web Speech API). */
  hasNativeAsr: boolean;
  /** Une translittération latine est-elle nécessaire à l'affichage ? */
  needsTransliteration: boolean;
}

/**
 * Les quatre compétences testables. Un même élément de contenu engendre
 * plusieurs cartes, une par compétence, chacune avec sa propre mémoire.
 * C'est le choix pédagogique central du projet : sans cela, on obtient un
 * apprenant qui reconnaît tout et ne produit rien.
 */
export const SKILLS = ['recognize', 'produce', 'listen', 'speak'] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  recognize: 'Compréhension écrite',
  produce: 'Expression écrite',
  listen: 'Compréhension orale',
  speak: 'Expression orale',
};

/** Niveaux CECRL couverts par les packs. */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2';

/** Nature d'un élément de contenu. */
export type ItemKind = 'word' | 'phrase' | 'sentence';

/**
 * Un élément de contenu : l'unité indivisible d'apprentissage.
 * `id` doit rester stable d'une version de pack à l'autre.
 */
export interface ContentItem {
  id: string;
  kind: ItemKind;
  /** Le texte dans la langue cible, tel qu'un natif l'écrirait. */
  target: string;
  /** Translittération latine (arabe tunisien uniquement). */
  translit?: string;
  /** Traduction française de référence. */
  fr: string;
  /**
   * Traductions françaises également acceptées en correction.
   * Indispensable : « bonjour » / « salut » ne doivent pas s'exclure.
   */
  frAlt?: string[];
  /** Variantes de la forme cible acceptées en production. */
  targetAlt?: string[];
  /** Catégorie grammaticale, pour les exercices ciblés. */
  pos?: 'noun' | 'verb' | 'adj' | 'adv' | 'phrase' | 'number' | 'pronoun' | 'prep';
  /** Genre grammatical, pertinent en es/it/fr. */
  gender?: 'm' | 'f';
  /** Phrase d'exemple dans la langue cible. */
  example?: string;
  /** Traduction de la phrase d'exemple. */
  exampleFr?: string;
  /** Note culturelle ou d'usage, affichée à l'apprentissage. */
  note?: string;
  /** Compétences pour lesquelles cet élément peut engendrer une carte. */
  skills?: Skill[];
}

/** Une leçon : un groupe cohérent d'éléments, ~8 à 12 pour rester digeste. */
export interface Lesson {
  id: string;
  title: string;
  /** Objectif concret, formulé côté apprenant. */
  goal: string;
  level: CefrLevel;
  items: ContentItem[];
}

/**
 * Une réplique de dialogue.
 *
 * `speaker` sert à alterner visuellement les tours de parole ; savoir qui parle
 * est la moitié de la compréhension d'un échange.
 */
export interface DialogueLine {
  speaker: 'a' | 'b';
  /** Réplique dans la langue cible. */
  target: string;
  /** Translittération latine (arabe tunisien). */
  translit?: string;
  fr: string;
}

/** Question de compréhension portant sur un dialogue. */
export interface DialogueQuestion {
  id: string;
  /** Question posée en français : on teste la compréhension, pas la lecture. */
  prompt: string;
  /** Réponses proposées, en français. */
  options: string[];
  /** Index de la bonne réponse dans `options`. */
  answer: number;
}

/**
 * Un dialogue : un échange court dans une situation concrète.
 *
 * Comble le manque le plus criant du vocabulaire isolé — savoir cent mots ne
 * permet pas de suivre une conversation, où le sens naît de l'enchaînement des
 * répliques, du contexte et de ce qui n'est pas dit. On écoute d'abord sans
 * lire, puis on répond à des questions de compréhension : c'est l'exercice qui
 * ressemble le plus à une conversation réelle.
 */
export interface Dialogue {
  id: string;
  /** Situation, formulée côté apprenant : « Commander au café ». */
  title: string;
  /** Contexte posé en une phrase, pour orienter l'écoute. */
  setting: string;
  level: CefrLevel;
  lines: DialogueLine[];
  questions: DialogueQuestion[];
}

/** Une unité thématique regroupant plusieurs leçons. */
export interface Unit {
  id: string;
  title: string;
  description: string;
  icon: string;
  lessons: Lesson[];
  /**
   * Dialogues de l'unité, débloqués une fois son vocabulaire rencontré.
   * Facultatif : une unité sans dialogue reste parfaitement valide.
   */
  dialogues?: Dialogue[];
}

/** Un pack de contenu : tout ce qui est apprenable dans une langue. */
export interface ContentPack {
  language: LanguageCode;
  /** Version du pack, incrémentée à chaque modification du contenu. */
  version: number;
  profile: LanguageProfile;
  units: Unit[];
}

/**
 * Identifiant d'une carte : couple (élément, compétence).
 * Encodé en chaîne pour servir de clé primaire en base.
 */
export type CardId = string;

export function cardId(itemId: string, skill: Skill): CardId {
  return `${itemId}::${skill}`;
}

export function parseCardId(id: CardId): { itemId: string; skill: Skill } {
  const idx = id.lastIndexOf('::');
  if (idx === -1) throw new Error(`Identifiant de carte invalide : ${id}`);
  return {
    itemId: id.slice(0, idx),
    skill: id.slice(idx + 2) as Skill,
  };
}

/** Note donnée par l'apprenant, convention FSRS. */
export const RATINGS = { again: 1, hard: 2, good: 3, easy: 4 } as const;
export type Rating = (typeof RATINGS)[keyof typeof RATINGS];

/** Étape du cycle de vie d'une carte. */
export type CardState = 'new' | 'learning' | 'review' | 'relearning';

/** État de mémoire d'une carte, persisté localement. */
export interface CardMemory {
  id: CardId;
  language: LanguageCode;
  itemId: string;
  skill: Skill;
  state: CardState;
  /** Stabilité FSRS, en jours : durée avant que la rétention tombe à 90 %. */
  stability: number;
  /** Difficulté FSRS, dans [1, 10]. */
  difficulty: number;
  /** Date de la prochaine échéance (epoch ms). */
  due: number;
  /** Date de la dernière révision (epoch ms), `null` si jamais vue. */
  lastReview: number | null;
  /** Nombre total de présentations. */
  reps: number;
  /** Nombre d'oublis (notes « à revoir »). */
  lapses: number;
  /** Index dans les paliers d'apprentissage, pour les cartes neuves. */
  learningStep: number;
}

/** Trace d'une révision, conservée pour les statistiques et l'optimisation FSRS. */
export interface ReviewLog {
  cardId: CardId;
  language: LanguageCode;
  skill: Skill;
  rating: Rating;
  /** Date de la révision (epoch ms). */
  reviewedAt: number;
  /** Temps de réponse en millisecondes. */
  elapsedMs: number;
  /** Intervalle écoulé depuis la révision précédente, en jours. */
  intervalDays: number;
  stabilityBefore: number;
  stabilityAfter: number;
  /** Type d'exercice ayant produit cette révision. */
  exercise: ExerciseKind;
}

/** Les formats d'exercice disponibles. */
export const EXERCISE_KINDS = [
  'flashcard',
  'multipleChoice',
  'typeAnswer',
  'listenChoice',
  'dictation',
  'buildSentence',
  'speakRepeat',
  'matchPairs',
  'dialogue',
] as const;
export type ExerciseKind = (typeof EXERCISE_KINDS)[number];

export const EXERCISE_LABELS: Record<ExerciseKind, string> = {
  flashcard: 'Carte mémoire',
  multipleChoice: 'Choix multiple',
  typeAnswer: 'Écrire la réponse',
  listenChoice: 'Écouter et choisir',
  dictation: 'Dictée',
  buildSentence: 'Reconstituer la phrase',
  speakRepeat: 'Répéter à voix haute',
  matchPairs: 'Associer les paires',
  dialogue: 'Comprendre un dialogue',
};

/** Compétence évaluée par chaque type d'exercice. */
export const EXERCISE_SKILL: Record<ExerciseKind, Skill> = {
  flashcard: 'recognize',
  multipleChoice: 'recognize',
  typeAnswer: 'produce',
  listenChoice: 'listen',
  dictation: 'listen',
  buildSentence: 'produce',
  speakRepeat: 'speak',
  matchPairs: 'recognize',
  dialogue: 'listen',
};
