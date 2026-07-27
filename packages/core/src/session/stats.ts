/**
 * Statistiques de progression.
 *
 * Ce module existe pour une raison précise : ce qui fait tenir sur plusieurs
 * mois, ce n'est pas la volonté, c'est de voir que ça avance. Un compteur de
 * mots « vus » est un mauvais indicateur — il ne fait que monter, même quand on
 * oublie tout. Les indicateurs retenus ici mesurent la mémoire réelle : combien
 * de mots tiendraient une semaine sans révision, et quelle est la charge à venir.
 */

import type { CardMemory, LanguageCode, ReviewLog, Skill } from '../types/index.js';
import { SKILLS } from '../types/index.js';
import { currentRetrievability } from '../srs/fsrs.js';

const MS_PER_DAY = 86_400_000;

/** Convertit un instant en clé de jour local `AAAA-MM-JJ`. */
export function dayKey(timestamp: number, timeZoneOffsetMinutes = new Date().getTimezoneOffset()): string {
  const shifted = new Date(timestamp - timeZoneOffsetMinutes * 60_000);
  return shifted.toISOString().slice(0, 10);
}

/**
 * Série de jours consécutifs d'activité.
 *
 * La journée en cours ne casse pas la série tant qu'elle n'est pas finie : on
 * accepte que le dernier jour actif soit aujourd'hui *ou* hier. Sans cela,
 * l'application annoncerait « série perdue » tous les matins au réveil, ce qui
 * est à la fois faux et démoralisant.
 */
export function computeStreak(activeDays: Iterable<string>, now: number): number {
  const days = new Set(activeDays);
  if (days.size === 0) return 0;

  const today = dayKey(now);
  const yesterday = dayKey(now - MS_PER_DAY);

  let cursor: string;
  if (days.has(today)) cursor = today;
  else if (days.has(yesterday)) cursor = yesterday;
  else return 0;

  let streak = 0;
  let timestamp = new Date(`${cursor}T12:00:00.000Z`).getTime();
  while (days.has(dayKey(timestamp, 0))) {
    streak += 1;
    timestamp -= MS_PER_DAY;
  }
  return streak;
}

export interface SkillMastery {
  skill: Skill;
  /** Cartes jamais présentées. */
  untouched: number;
  /** Cartes en cours d'acquisition (stabilité < 7 jours). */
  learning: number;
  /** Cartes tenant au moins une semaine. */
  solid: number;
  /** Cartes tenant au moins un mois. */
  mastered: number;
  /** Probabilité de rappel moyenne, sur les cartes déjà vues. */
  averageRetrievability: number;
}

const SOLID_THRESHOLD_DAYS = 7;
const MASTERED_THRESHOLD_DAYS = 30;

/** Répartition de la maîtrise par compétence, pour une langue. */
export function masteryBySkill(
  memories: Iterable<CardMemory>,
  language: LanguageCode,
  now: number,
): SkillMastery[] {
  const buckets = new Map<Skill, SkillMastery & { _sum: number; _seen: number }>();
  for (const skill of SKILLS) {
    buckets.set(skill, {
      skill,
      untouched: 0,
      learning: 0,
      solid: 0,
      mastered: 0,
      averageRetrievability: 0,
      _sum: 0,
      _seen: 0,
    });
  }

  for (const memory of memories) {
    if (memory.language !== language) continue;
    const bucket = buckets.get(memory.skill);
    if (!bucket) continue;

    if (memory.state === 'new' || memory.lastReview === null) {
      bucket.untouched += 1;
      continue;
    }

    bucket._seen += 1;
    bucket._sum += currentRetrievability(memory, now);

    if (memory.stability >= MASTERED_THRESHOLD_DAYS) bucket.mastered += 1;
    else if (memory.stability >= SOLID_THRESHOLD_DAYS) bucket.solid += 1;
    else bucket.learning += 1;
  }

  return [...buckets.values()].map(({ _sum, _seen, ...rest }) => ({
    ...rest,
    averageRetrievability: _seen === 0 ? 0 : _sum / _seen,
  }));
}

export interface ForecastDay {
  /** Décalage en jours depuis aujourd'hui. */
  offset: number;
  dayKey: string;
  count: number;
}

/**
 * Charge de révisions prévue pour les `days` prochains jours.
 *
 * Indicateur volontairement mis en avant dans l'interface : voir venir un pic à
 * 200 cartes permet d'ajuster le plafond de nouveautés *avant* de se retrouver
 * dedans. C'est le principal outil de pilotage sur la durée.
 */
export function forecast(
  memories: Iterable<CardMemory>,
  language: LanguageCode,
  now: number,
  days = 14,
): ForecastDay[] {
  const result: ForecastDay[] = Array.from({ length: days }, (_, offset) => ({
    offset,
    dayKey: dayKey(now + offset * MS_PER_DAY),
    count: 0,
  }));

  for (const memory of memories) {
    if (memory.language !== language) continue;
    if (memory.state === 'new') continue;
    const offset = Math.max(0, Math.floor((memory.due - now) / MS_PER_DAY));
    const slot = result[Math.min(offset, days - 1)];
    if (slot && offset < days) slot.count += 1;
  }

  return result;
}

export interface RetentionStats {
  /** Révisions prises en compte (cartes déjà connues, hors premières découvertes). */
  reviews: number;
  /** Part de révisions réussies. */
  retention: number;
  /** Temps de réponse médian, en millisecondes. */
  medianResponseMs: number;
}

/**
 * Taux de rétention réel, mesuré sur l'historique.
 *
 * À comparer à la rétention visée (0,90 par défaut) : si le taux mesuré est
 * nettement en dessous, c'est que les paramètres FSRS ne collent pas à cet
 * apprenant et qu'il faut les ré-optimiser sur son historique.
 */
export function retentionStats(logs: readonly ReviewLog[], sinceMs?: number): RetentionStats {
  const relevant = logs.filter(
    (log) => log.intervalDays >= 1 && (sinceMs === undefined || log.reviewedAt >= sinceMs),
  );
  if (relevant.length === 0) {
    return { reviews: 0, retention: 0, medianResponseMs: 0 };
  }

  const passed = relevant.filter((log) => log.rating > 1).length;
  const times = relevant.map((log) => log.elapsedMs).sort((a, b) => a - b);
  const mid = Math.floor(times.length / 2);
  const median =
    times.length % 2 === 0 ? ((times[mid - 1] ?? 0) + (times[mid] ?? 0)) / 2 : (times[mid] ?? 0);

  return {
    reviews: relevant.length,
    retention: passed / relevant.length,
    medianResponseMs: median,
  };
}

/**
 * Éléments les plus problématiques : beaucoup d'oublis rapportés au nombre de
 * présentations. Ce sont eux qu'il faut traiter autrement — avec une phrase
 * d'exemple, une image, un moyen mnémotechnique — plutôt que de les repasser en
 * boucle dans le même exercice qui échoue depuis trois semaines.
 */
export function leeches(
  memories: Iterable<CardMemory>,
  language: LanguageCode,
  minLapses = 4,
  limit = 10,
): CardMemory[] {
  return [...memories]
    .filter((m) => m.language === language && m.lapses >= minLapses)
    .sort((a, b) => b.lapses / Math.max(b.reps, 1) - a.lapses / Math.max(a.reps, 1))
    .slice(0, limit);
}
