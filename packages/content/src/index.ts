import type { ContentPack, Dialogue, LanguageCode, LanguageProfile } from '@polyglotte/core';
import { AEB } from './packs/aeb.js';
import { EN } from './packs/en.js';
import { ES } from './packs/es.js';
import { IT } from './packs/it.js';

export * from './schema.js';
export { AEB, EN, ES, IT };

/** Tous les packs disponibles, indexés par code de langue. */
export const PACKS: Record<LanguageCode, ContentPack> = {
  en: EN,
  es: ES,
  aeb: AEB,
  it: IT,
};

/** Ordre d'affichage sur l'écran d'accueil. */
export const PACK_ORDER: LanguageCode[] = ['en', 'es', 'it', 'aeb'];

export function getPack(language: LanguageCode): ContentPack {
  return PACKS[language];
}

export function getProfile(language: LanguageCode): LanguageProfile {
  return PACKS[language].profile;
}

/**
 * Dialogues dont le vocabulaire a déjà été rencontré.
 *
 * Un dialogue proposé trop tôt n'est qu'un mur de sons inconnus : décourageant,
 * et sans valeur pédagogique. On n'ouvre celui d'une unité qu'une fois la
 * majorité de son vocabulaire vue — le seuil est bas (60 %) parce que
 * comprendre un échange sans en connaître tous les mots est précisément la
 * compétence qu'on cherche à installer.
 */
export function unlockedDialogues(
  language: LanguageCode,
  seenItemIds: ReadonlySet<string>,
  threshold = 0.6,
): Dialogue[] {
  const unlocked: Dialogue[] = [];
  for (const unit of PACKS[language].units) {
    if (!unit.dialogues?.length) continue;
    const items = unit.lessons.flatMap((l) => l.items);
    if (items.length === 0) continue;
    const seen = items.filter((item) => seenItemIds.has(item.id)).length;
    if (seen / items.length >= threshold) unlocked.push(...unit.dialogues);
  }
  return unlocked;
}

export const PROFILES: LanguageProfile[] = PACK_ORDER.map((code) => PACKS[code].profile);
