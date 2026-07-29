/**
 * Accès aux données : la seule couche autorisée à parler à Dexie.
 *
 * L'interface n'appelle jamais la base directement. Cela isole complètement le
 * choix du stockage — le jour où une synchronisation serveur s'ajoute, seul ce
 * fichier change.
 */

import type { CardMemory, LanguageCode, Rating, ReviewLog, Skill } from '@polyglotte/core';
import { cardId, createMemory, review } from '@polyglotte/core';
import type { ExerciseKind, SchedulerConfig } from '@polyglotte/core';
import { db, dayRecordKey, type DayRecord, type DialogueRecord, type StoredMemory } from './database.js';
import { dayKey } from '@polyglotte/core';

/** Toutes les mémoires d'une langue, indexées par identifiant de carte. */
export async function loadMemories(language: LanguageCode): Promise<Map<string, CardMemory>> {
  const rows = await db.memories.where('language').equals(language).toArray();
  return new Map(rows.map((row) => [row.id, row]));
}

/** Mémoire d'une carte, créée à la volée si elle n'existe pas encore. */
export async function getOrCreateMemory(
  itemId: string,
  skill: Skill,
  language: LanguageCode,
  now: number,
): Promise<CardMemory> {
  const id = cardId(itemId, skill);
  const existing = await db.memories.get(id);
  return existing ?? createMemory(id, itemId, skill, language, now);
}

export interface RecordReviewInput {
  itemId: string;
  skill: Skill;
  language: LanguageCode;
  rating: Rating;
  exercise: ExerciseKind;
  /** Temps de réponse, en millisecondes. */
  elapsedMs: number;
  now: number;
  config: SchedulerConfig;
}

export interface RecordReviewOutput {
  memory: CardMemory;
  intervalDays: number;
  wasNew: boolean;
}

/**
 * Enregistre une réponse : met à jour la mémoire, journalise la révision et
 * met à jour le bilan du jour, le tout dans une transaction unique.
 *
 * La transaction compte : sans elle, une fermeture d'onglet au mauvais moment
 * peut avancer l'échéance d'une carte sans jamais journaliser la révision, et
 * les statistiques divergent silencieusement de la réalité.
 */
export async function recordReview(input: RecordReviewInput): Promise<RecordReviewOutput> {
  const { itemId, skill, language, rating, exercise, elapsedMs, now, config } = input;
  const id = cardId(itemId, skill);

  return db.transaction('rw', db.memories, db.logs, db.days, async () => {
    const existing = await db.memories.get(id);
    const before: CardMemory = existing ?? createMemory(id, itemId, skill, language, now);
    const wasNew = before.state === 'new';

    const elapsedDays =
      before.lastReview === null ? 0 : (now - before.lastReview) / 86_400_000;
    const result = review(before, rating, now, config);

    const stored: StoredMemory = { ...result.memory, updatedAt: now };
    await db.memories.put(stored);

    const log: ReviewLog = {
      cardId: id,
      language,
      skill,
      rating,
      reviewedAt: now,
      elapsedMs,
      intervalDays: elapsedDays,
      stabilityBefore: result.stabilityBefore,
      stabilityAfter: result.memory.stability,
      exercise,
    };
    await db.logs.add(log);

    const day = dayKey(now);
    const key = dayRecordKey(day, language);
    const record = (await db.days.get(key)) ?? {
      key,
      day,
      language,
      reviews: 0,
      newCards: 0,
      correct: 0,
      timeMs: 0,
    };
    await db.days.put({
      ...record,
      reviews: record.reviews + 1,
      newCards: record.newCards + (wasNew ? 1 : 0),
      correct: record.correct + (rating > 1 ? 1 : 0),
      timeMs: record.timeMs + elapsedMs,
    });

    return { memory: result.memory, intervalDays: result.intervalDays, wasNew };
  });
}

/** Nombre de cartes dues à l'instant donné, pour le badge de l'accueil. */
export async function countDue(language: LanguageCode, now: number): Promise<number> {
  return db.memories.where('[language+due]').between([language, 0], [language, now], true, true).count();
}

/** Nombre de cartes déjà rencontrées, toutes compétences confondues. */
export async function countSeen(language: LanguageCode): Promise<number> {
  const rows = await db.memories.where('language').equals(language).toArray();
  return new Set(rows.filter((row) => row.state !== 'new').map((row) => row.itemId)).size;
}

/** Nouvelles cartes déjà introduites aujourd'hui, pour respecter le plafond. */
export async function newCardsToday(language: LanguageCode, now: number): Promise<number> {
  const record = await db.days.get(dayRecordKey(dayKey(now), language));
  return record?.newCards ?? 0;
}

/** Journées d'activité, toutes langues confondues, pour la série. */
export async function loadActiveDays(): Promise<string[]> {
  const rows = await db.days.toArray();
  return [...new Set(rows.filter((row) => row.reviews > 0).map((row) => row.day))];
}

export async function loadDayRecords(language: LanguageCode): Promise<DayRecord[]> {
  const rows = await db.days.where('language').equals(language).toArray();
  return rows.sort((a, b) => a.day.localeCompare(b.day));
}

export async function loadLogs(language: LanguageCode, sinceMs?: number): Promise<ReviewLog[]> {
  const collection =
    sinceMs === undefined
      ? db.logs.where('language').equals(language)
      : db.logs.where('[language+reviewedAt]').between([language, sinceMs], [language, Infinity]);
  return collection.toArray();
}

/**
 * Identifiants des éléments jamais rencontrés, dans l'ordre du pack.
 *
 * Un élément compte comme rencontré dès qu'une seule de ses cartes est sortie
 * de l'état neuf : on ne réintroduit pas un mot déjà vu en reconnaissance sous
 * prétexte que sa carte de prononciation n'existe pas encore.
 */
export async function pendingNewItems(
  language: LanguageCode,
  orderedItemIds: string[],
): Promise<string[]> {
  const rows = await db.memories.where('language').equals(language).toArray();
  const touched = new Set(rows.filter((row) => row.state !== 'new').map((row) => row.itemId));
  return orderedItemIds.filter((id) => !touched.has(id));
}

/** Identifiants des éléments déjà rencontrés, pour débloquer les dialogues. */
export async function seenItemIds(language: LanguageCode): Promise<Set<string>> {
  const rows = await db.memories.where('language').equals(language).toArray();
  return new Set(rows.filter((row) => row.state !== 'new').map((row) => row.itemId));
}

export async function loadDialogueRecords(language: LanguageCode): Promise<Map<string, DialogueRecord>> {
  const rows = await db.dialogues.where('language').equals(language).toArray();
  return new Map(rows.map((row) => [row.id, row]));
}

/**
 * Enregistre le passage sur un dialogue.
 *
 * On conserve le *meilleur* score et non le dernier : refaire un dialogue déjà
 * réussi pour vérifier une tournure ne doit pas dégrader le bilan.
 */
export async function recordDialogue(
  id: string,
  language: LanguageCode,
  correct: number,
  totalQuestions: number,
  now: number,
): Promise<void> {
  const existing = await db.dialogues.get(id);
  await db.dialogues.put({
    id,
    language,
    attempts: (existing?.attempts ?? 0) + 1,
    bestCorrect: Math.max(existing?.bestCorrect ?? 0, correct),
    totalQuestions,
    lastSeenAt: now,
  });
}

// --------------------------------------------------------------------------
// Sauvegarde
// --------------------------------------------------------------------------

export interface BackupFile {
  format: 'polyglotte-backup';
  version: 1;
  exportedAt: number;
  memories: StoredMemory[];
  logs: ReviewLog[];
  days: DayRecord[];
  settings: unknown;
}

/**
 * Exporte toute la progression.
 *
 * Fonctionnalité de première nécessité, pas un confort : les données vivent
 * dans le stockage du navigateur, qu'un nettoyage un peu zélé peut effacer.
 * Perdre huit mois de mémorisation ainsi mettrait un terme au projet.
 */
export async function exportBackup(): Promise<BackupFile> {
  const [memories, logs, days, settings] = await Promise.all([
    db.memories.toArray(),
    db.logs.toArray(),
    db.days.toArray(),
    db.settings.get('settings'),
  ]);
  return {
    format: 'polyglotte-backup',
    version: 1,
    exportedAt: Date.now(),
    memories,
    logs: logs.map(({ ...log }) => log),
    days,
    settings,
  };
}

/**
 * Restaure une sauvegarde, en fusionnant plutôt qu'en écrasant.
 *
 * En cas de conflit sur une carte, on garde l'enregistrement le plus récent.
 * Écraser aveuglément ferait perdre les révisions faites depuis l'export, ce
 * qui est le scénario le plus courant : on restaure sur un appareil déjà
 * utilisé, pas sur une installation vierge.
 */
export async function importBackup(backup: BackupFile): Promise<{ merged: number; skipped: number }> {
  if (backup.format !== 'polyglotte-backup') {
    throw new Error('Fichier de sauvegarde non reconnu.');
  }

  let merged = 0;
  let skipped = 0;

  await db.transaction('rw', db.memories, db.logs, db.days, db.settings, async () => {
    for (const incoming of backup.memories) {
      const existing = await db.memories.get(incoming.id);
      if (existing && (existing.updatedAt ?? 0) >= (incoming.updatedAt ?? 0)) {
        skipped += 1;
        continue;
      }
      await db.memories.put(incoming);
      merged += 1;
    }

    // Les journées se cumulent : deux appareils utilisés le même jour ont
    // chacun une part de l'activité, et la somme est la bonne réponse.
    for (const day of backup.days) {
      const existing = await db.days.get(day.key);
      await db.days.put(
        existing
          ? {
              ...existing,
              reviews: Math.max(existing.reviews, day.reviews),
              newCards: Math.max(existing.newCards, day.newCards),
              correct: Math.max(existing.correct, day.correct),
              timeMs: Math.max(existing.timeMs, day.timeMs),
            }
          : day,
      );
    }

    if (backup.logs.length > 0) {
      await db.logs.bulkAdd(backup.logs as never[]);
    }
  });

  return { merged, skipped };
}

/** Efface toute la progression. Réservé aux réglages, avec confirmation. */
export async function resetAll(): Promise<void> {
  await db.transaction('rw', db.memories, db.logs, db.days, db.dialogues, async () => {
    await db.memories.clear();
    await db.logs.clear();
    await db.days.clear();
    await db.dialogues.clear();
  });
}
