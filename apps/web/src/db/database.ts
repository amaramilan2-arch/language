/**
 * Persistance locale, sur IndexedDB via Dexie.
 *
 * Choix structurant du projet : tout vit sur l'appareil. Aucun serveur, aucun
 * compte, aucune connexion requise. Trois raisons, dans cet ordre :
 *
 *  - Fiabilité. Une application qui dépend d'un serveur meurt le jour où le
 *    serveur s'arrête. Sur un projet personnel destiné à durer des mois, c'est
 *    le mode de défaillance le plus probable, et de loin.
 *  - Disponibilité. Réviser tous les jours suppose de pouvoir réviser dans le
 *    métro, en avion, à l'étranger sans forfait. Le local-first le garantit.
 *  - Coût. Zéro. Le projet peut rester en ligne indéfiniment sans surveiller
 *    une facture.
 *
 * La contrepartie — pas de synchronisation entre appareils — est traitée par
 * l'export et l'import de sauvegarde, et par une couche de synchronisation
 * prévue en phase 3 (voir `docs/ROADMAP.md`). Le schéma est déjà pensé pour :
 * chaque enregistrement porte un `updatedAt`, de quoi arbitrer une fusion.
 */

import Dexie, { type Table } from 'dexie';
import type { CardMemory, LanguageCode, ReviewLog, Skill } from '@polyglotte/core';

/** Mémoire d'une carte, augmentée de l'horodatage nécessaire à une future fusion. */
export interface StoredMemory extends CardMemory {
  updatedAt: number;
}

/** Trace d'une révision. `id` est attribué par la base. */
export interface StoredLog extends ReviewLog {
  id?: number;
}

/** Bilan d'une journée d'activité, pour la série et les graphiques. */
export interface DayRecord {
  /** Clé `AAAA-MM-JJ` en heure locale, éventuellement suffixée par la langue. */
  key: string;
  day: string;
  language: LanguageCode;
  reviews: number;
  newCards: number;
  correct: number;
  /** Temps passé, en millisecondes. */
  timeMs: number;
}

export interface Settings {
  id: 'settings';
  /** Langue affichée au démarrage. */
  activeLanguage: LanguageCode;
  /** Plafond de nouvelles cartes par session, par langue. */
  newCardsPerSession: Record<LanguageCode, number>;
  /** Nombre d'exercices visé par session. */
  sessionLength: number;
  /** Probabilité de rappel visée, entre 0,80 et 0,97. */
  desiredRetention: number;
  /** Compétences activées. Permet d'éteindre l'oral en open space. */
  enabledSkills: Skill[];
  /** Lecture automatique de l'audio à l'affichage d'une carte. */
  autoPlayAudio: boolean;
  /** Affichage de la translittération (arabe tunisien). */
  showTransliteration: boolean;
  /** Vitesse de la synthèse vocale, entre 0,5 et 1,2. */
  speechRate: number;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  activeLanguage: 'en',
  // Huit nouvelles cartes par session, soit une trentaine de révisions par jour
  // au régime de croisière. C'est volontairement modeste : le réflexe de tout
  // débutant est de mettre 30, et c'est exactement ainsi qu'on abandonne au bout
  // de trois semaines, écrasé par l'arriéré qu'on s'est créé soi-même.
  newCardsPerSession: { en: 8, es: 8, aeb: 6, it: 8 },
  sessionLength: 20,
  desiredRetention: 0.9,
  enabledSkills: ['recognize', 'produce', 'listen', 'speak'],
  autoPlayAudio: true,
  showTransliteration: true,
  speechRate: 0.9,
  updatedAt: 0,
};

export class PolyglotteDatabase extends Dexie {
  memories!: Table<StoredMemory, string>;
  logs!: Table<StoredLog, number>;
  days!: Table<DayRecord, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('polyglotte');

    this.version(1).stores({
      // `[language+due]` est l'index qui porte la requête la plus fréquente de
      // toute l'application : « quelles cartes sont à réviser maintenant ».
      memories: 'id, language, itemId, skill, due, [language+due], [language+state]',
      logs: '++id, cardId, language, reviewedAt, [language+reviewedAt]',
      days: 'key, day, language, [language+day]',
      settings: 'id',
    });
  }
}

export const db = new PolyglotteDatabase();

/**
 * Réglages courants, complétés par les valeurs par défaut.
 *
 * La fusion avec `DEFAULT_SETTINGS` n'est pas cosmétique : elle garantit qu'un
 * réglage ajouté dans une version ultérieure de l'application ne renvoie pas
 * `undefined` chez un utilisateur installé de longue date.
 */
export async function loadSettings(): Promise<Settings> {
  const stored = await db.settings.get('settings');
  return { ...DEFAULT_SETTINGS, ...stored, id: 'settings' };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const current = await loadSettings();
  const next: Settings = { ...current, ...patch, id: 'settings', updatedAt: Date.now() };
  await db.settings.put(next);
  return next;
}

/** Clé composite d'un enregistrement journalier. */
export function dayRecordKey(day: string, language: LanguageCode): string {
  return `${day}::${language}`;
}
