import type { ContentItem, LanguageProfile, Rating, Skill } from '@polyglotte/core';
import { RATINGS } from '@polyglotte/core';
import type { Settings } from '../db/database.js';

export interface ExerciseProps {
  /** Élément testé. */
  item: ContentItem;
  /** Autres éléments disponibles, pour fabriquer les distracteurs. */
  pool: ContentItem[];
  profile: LanguageProfile;
  /** Compétence évaluée : un même format sert parfois plusieurs compétences. */
  skill: Skill;
  settings: Settings;
  /** Graine d'aléa, renouvelée à chaque présentation. */
  seed: number;
  /** Première rencontre avec cet élément : on montre avant de tester. */
  isFirstEncounter: boolean;
  onAnswer: (result: AnswerResult) => void;
}

export interface AnswerResult {
  rating: Rating;
  correct: boolean;
}

/**
 * Traduit une correction automatique en note FSRS.
 *
 * Trois niveaux plutôt que quatre : « facile » n'est pas déductible d'une bonne
 * réponse — on ne sait pas si elle a été immédiate ou arrachée après dix
 * secondes d'hésitation. Le prétendre fausserait la planification. « Facile »
 * reste donc réservé aux exercices où l'apprenant s'auto-évalue.
 */
export function autoRating(correct: boolean, hadHint: boolean): Rating {
  if (!correct) return RATINGS.again;
  return hadHint ? RATINGS.hard : RATINGS.good;
}

/** Réponses françaises acceptées pour un élément. */
export function acceptedFrench(item: ContentItem): string[] {
  return [item.fr, ...(item.frAlt ?? [])];
}

/** Réponses acceptées dans la langue cible. */
export function acceptedTarget(item: ContentItem): string[] {
  return [item.target, ...(item.targetAlt ?? [])];
}
