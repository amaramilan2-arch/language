import type { ContentPack, LanguageCode, LanguageProfile } from '@polyglotte/core';
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

export const PROFILES: LanguageProfile[] = PACK_ORDER.map((code) => PACKS[code].profile);
