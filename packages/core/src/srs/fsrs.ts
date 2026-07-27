/**
 * Implémentation de FSRS-5 (Free Spaced Repetition Scheduler).
 *
 * Pourquoi FSRS plutôt que SM-2 (l'algorithme d'Anki historique, et celui que
 * copient la plupart des applications) : SM-2 ne modélise qu'un facteur de
 * facilité multiplicatif, sans notion de probabilité de rappel. FSRS modélise
 * explicitement la mémoire par deux variables — la stabilité (combien de temps
 * le souvenir tient) et la difficulté (à quel point il résiste) — et planifie la
 * révision à l'instant où la probabilité de rappel atteint une cible choisie.
 * À rétention égale, cela représente environ 20 à 30 % de révisions en moins.
 * Sur un apprentissage qui dure des mois, c'est la différence entre une charge
 * quotidienne tenable et un abandon.
 *
 * Ce module est volontairement pur : aucune entrée/sortie, aucune dépendance,
 * aucune notion de temps implicite (l'horloge est toujours passée en paramètre).
 * C'est ce qui le rend testable de façon déterministe.
 *
 * Référence : https://github.com/open-spaced-repetition/fsrs4anki/wiki
 */

import type { CardMemory, CardId, LanguageCode, Rating, Skill } from '../types/index.js';
import { RATINGS } from '../types/index.js';

/**
 * Les 19 paramètres FSRS-5. Ce sont les valeurs par défaut, entraînées sur un
 * large corpus public. Elles peuvent être ré-optimisées par apprenant une fois
 * qu'il a accumulé assez d'historique (voir `docs/ROADMAP.md`, phase 4).
 */
export const DEFAULT_PARAMS: readonly number[] = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813,
  0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567,
];

/** Exposant de la courbe d'oubli FSRS-5. */
const DECAY = -0.5;
/**
 * Facteur tel que R = 0,9 exactement lorsque le temps écoulé égale la stabilité.
 * Vaut 19/81 pour DECAY = -0,5.
 */
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;

/** Bornes de sécurité : une carte ne doit jamais sortir du calendrier. */
const MIN_STABILITY = 0.01;
const MAX_STABILITY = 36500;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_INTERVAL_DAYS = 1;
const MAX_INTERVAL_DAYS = 365 * 5;

const MS_PER_DAY = 86_400_000;

export interface SchedulerConfig {
  /**
   * Probabilité de rappel visée au moment de la révision, dans ]0, 1[.
   * 0,90 est le bon compromis par défaut : plus haut, on révise beaucoup pour
   * peu de gain ; plus bas, on oublie trop et la remise en selle coûte cher.
   */
  desiredRetention: number;
  params: readonly number[];
  /** Intervalle maximum en jours, pour éviter les échéances à 10 ans. */
  maximumIntervalDays: number;
}

export const DEFAULT_CONFIG: SchedulerConfig = {
  desiredRetention: 0.9,
  params: DEFAULT_PARAMS,
  maximumIntervalDays: MAX_INTERVAL_DAYS,
};

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function param(config: SchedulerConfig, index: number): number {
  const value = config.params[index];
  if (value === undefined) {
    throw new Error(`Paramètre FSRS manquant à l'index ${index}`);
  }
  return value;
}

/**
 * Probabilité de se rappeler la carte après `elapsedDays` jours,
 * pour une stabilité donnée. C'est la courbe d'oubli du modèle.
 */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(elapsedDays, 0);
  return Math.pow(1 + (FACTOR * t) / stability, DECAY);
}

/** Probabilité de rappel d'une carte à l'instant `now`. */
export function currentRetrievability(memory: CardMemory, now: number): number {
  if (memory.lastReview === null) return 0;
  const elapsedDays = (now - memory.lastReview) / MS_PER_DAY;
  return retrievability(elapsedDays, memory.stability);
}

/**
 * Intervalle, en jours, au bout duquel la probabilité de rappel tombera
 * à `desiredRetention`. C'est l'inverse de la courbe d'oubli.
 */
export function nextIntervalDays(stability: number, config: SchedulerConfig): number {
  const raw = (stability / FACTOR) * (Math.pow(config.desiredRetention, 1 / DECAY) - 1);
  return clamp(Math.round(raw), MIN_INTERVAL_DAYS, config.maximumIntervalDays);
}

/** Stabilité initiale, fonction de la première note donnée. */
function initialStability(rating: Rating, config: SchedulerConfig): number {
  return clamp(param(config, rating - 1), MIN_STABILITY, MAX_STABILITY);
}

/** Difficulté initiale, fonction de la première note donnée. */
function initialDifficulty(rating: Rating, config: SchedulerConfig): number {
  const d = param(config, 4) - Math.exp(param(config, 5) * (rating - 1)) + 1;
  return clamp(d, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/**
 * Mise à jour de la difficulté, avec amortissement linéaire et retour à la
 * moyenne. Le retour à la moyenne empêche une carte notée « difficile » plusieurs
 * fois de suite de rester bloquée à 10 pour toujours.
 */
function nextDifficulty(difficulty: number, rating: Rating, config: SchedulerConfig): number {
  const delta = -param(config, 6) * (rating - 3);
  // Amortissement : plus la difficulté est déjà haute, moins elle bouge.
  const damped = difficulty + delta * ((10 - difficulty) / 9);
  // Retour vers la difficulté d'une carte apprise « facilement ».
  const reverted =
    param(config, 7) * initialDifficulty(RATINGS.easy, config) + (1 - param(config, 7)) * damped;
  return clamp(reverted, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/** Stabilité après un rappel réussi (note « difficile », « correct » ou « facile »). */
function stabilityAfterRecall(
  stability: number,
  difficulty: number,
  r: number,
  rating: Rating,
  config: SchedulerConfig,
): number {
  const hardPenalty = rating === RATINGS.hard ? param(config, 15) : 1;
  const easyBonus = rating === RATINGS.easy ? param(config, 16) : 1;
  const growth =
    1 +
    Math.exp(param(config, 8)) *
      (11 - difficulty) *
      Math.pow(stability, -param(config, 9)) *
      (Math.exp(param(config, 10) * (1 - r)) - 1) *
      hardPenalty *
      easyBonus;
  return clamp(stability * growth, MIN_STABILITY, MAX_STABILITY);
}

/**
 * Stabilité après un oubli. Elle est bornée par la stabilité précédente : un
 * oubli ne doit jamais *augmenter* l'intervalle, ce qui serait absurde et arrive
 * pourtant si l'on applique la formule brute sur de très petites stabilités.
 */
function stabilityAfterForget(
  stability: number,
  difficulty: number,
  r: number,
  config: SchedulerConfig,
): number {
  const raw =
    param(config, 11) *
    Math.pow(difficulty, -param(config, 12)) *
    (Math.pow(stability + 1, param(config, 13)) - 1) *
    Math.exp(param(config, 14) * (1 - r));
  return clamp(Math.min(raw, stability), MIN_STABILITY, MAX_STABILITY);
}

/**
 * Stabilité après une révision le jour même (FSRS-5). Répéter une carte dans la
 * même session la consolide un peu, mais beaucoup moins qu'une révision espacée :
 * c'est exactement ce que le bachotage a de trompeur, et le modèle le sait.
 */
function shortTermStability(stability: number, rating: Rating, config: SchedulerConfig): number {
  const next = stability * Math.exp(param(config, 17) * (rating - 3 + param(config, 18)));
  return clamp(next, MIN_STABILITY, MAX_STABILITY);
}

/** Crée l'état mémoire d'une carte jamais vue. */
export function createMemory(
  id: CardId,
  itemId: string,
  skill: Skill,
  language: LanguageCode,
  now: number,
): CardMemory {
  return {
    id,
    language,
    itemId,
    skill,
    state: 'new',
    stability: 0,
    difficulty: 0,
    due: now,
    lastReview: null,
    reps: 0,
    lapses: 0,
    learningStep: 0,
  };
}

export interface ReviewResult {
  memory: CardMemory;
  /** Intervalle appliqué, en jours. Vaut 0 pour une carte encore en apprentissage. */
  intervalDays: number;
  stabilityBefore: number;
  /** Probabilité de rappel estimée juste avant la révision. */
  retrievabilityBefore: number;
}

/**
 * Applique une note à une carte et renvoie son nouvel état mémoire.
 *
 * La fonction est pure : elle ne modifie pas `memory` et ne lit pas l'horloge.
 * Toute la logique « quand remontrer la carte dans la session en cours » vit
 * dans le moteur de session, pas ici — FSRS raisonne en jours, la session en
 * minutes, et mélanger les deux est la source d'erreur classique de ce genre
 * de code.
 */
export function review(
  memory: CardMemory,
  rating: Rating,
  now: number,
  config: SchedulerConfig = DEFAULT_CONFIG,
): ReviewResult {
  const stabilityBefore = memory.stability;

  // Première présentation : on initialise le modèle plutôt que de le mettre à jour.
  if (memory.state === 'new' || memory.lastReview === null) {
    const stability = initialStability(rating, config);
    const difficulty = initialDifficulty(rating, config);
    const failed = rating === RATINGS.again;
    const intervalDays = failed ? 0 : nextIntervalDays(stability, config);

    return {
      memory: {
        ...memory,
        state: failed ? 'learning' : 'review',
        stability,
        difficulty,
        due: failed ? now : now + intervalDays * MS_PER_DAY,
        lastReview: now,
        reps: memory.reps + 1,
        lapses: memory.lapses,
        learningStep: failed ? 1 : 0,
      },
      intervalDays,
      stabilityBefore,
      retrievabilityBefore: 0,
    };
  }

  const elapsedDays = (now - memory.lastReview) / MS_PER_DAY;
  const r = retrievability(elapsedDays, memory.stability);
  const difficulty = nextDifficulty(memory.difficulty, rating, config);

  // Révision le jour même : on applique la formule court terme, qui reflète le
  // gain réduit d'une répétition rapprochée.
  const sameDay = elapsedDays < 1;

  let stability: number;
  if (rating === RATINGS.again) {
    stability = stabilityAfterForget(memory.stability, difficulty, r, config);
  } else if (sameDay) {
    stability = shortTermStability(memory.stability, rating, config);
  } else {
    stability = stabilityAfterRecall(memory.stability, difficulty, r, rating, config);
  }

  const failed = rating === RATINGS.again;
  const intervalDays = failed ? 0 : nextIntervalDays(stability, config);

  return {
    memory: {
      ...memory,
      state: failed ? 'relearning' : 'review',
      stability,
      difficulty,
      due: failed ? now : now + intervalDays * MS_PER_DAY,
      lastReview: now,
      reps: memory.reps + 1,
      lapses: failed ? memory.lapses + 1 : memory.lapses,
      learningStep: failed ? 1 : 0,
    },
    intervalDays,
    stabilityBefore,
    retrievabilityBefore: r,
  };
}

/**
 * Prévisualise l'intervalle qu'entraînerait chaque note, sans rien modifier.
 * Sert à afficher « à revoir dans : 10 min / 2 j / 5 j / 12 j » sous les boutons,
 * ce qui aide beaucoup l'apprenant à noter honnêtement.
 */
export function previewIntervals(
  memory: CardMemory,
  now: number,
  config: SchedulerConfig = DEFAULT_CONFIG,
): Record<Rating, number> {
  return {
    [RATINGS.again]: review(memory, RATINGS.again, now, config).intervalDays,
    [RATINGS.hard]: review(memory, RATINGS.hard, now, config).intervalDays,
    [RATINGS.good]: review(memory, RATINGS.good, now, config).intervalDays,
    [RATINGS.easy]: review(memory, RATINGS.easy, now, config).intervalDays,
  };
}
