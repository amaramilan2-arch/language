/**
 * Construction et validation des packs de contenu.
 *
 * Les packs sont écrits à la main : c'est un choix. Du contenu généré
 * automatiquement produit des traductions plates et des exemples qui sonnent
 * faux, et en langue c'est rédhibitoire — on retient ce qu'on entend dire, pas
 * ce qui est grammaticalement correct. Les fonctions ci-dessous existent donc
 * pour rendre l'écriture manuelle supportable, pas pour l'éviter.
 *
 * La validation, elle, est automatique et tourne en intégration continue :
 * un identifiant en double ou une traduction manquante casse la construction
 * plutôt que d'atterrir silencieusement devant l'apprenant.
 */

import type {
  CefrLevel,
  ContentItem,
  ContentPack,
  Lesson,
  LanguageCode,
  Skill,
  Unit,
} from '@polyglotte/core';

/** Champs optionnels d'un élément, abrégés pour garder les packs lisibles. */
export interface ItemOptions {
  /** Traductions françaises également acceptées. */
  alt?: string[];
  /** Variantes acceptées dans la langue cible. */
  targetAlt?: string[];
  /** Translittération latine (arabe tunisien). */
  tr?: string;
  pos?: ContentItem['pos'];
  gender?: ContentItem['gender'];
  /** Phrase d'exemple dans la langue cible. */
  ex?: string;
  /** Traduction de la phrase d'exemple. */
  exFr?: string;
  /** Note d'usage ou culturelle. */
  note?: string;
  /** Restreint les compétences testées sur cet élément. */
  skills?: Skill[];
}

function build(kind: ContentItem['kind'], id: string, target: string, fr: string, options: ItemOptions = {}): ContentItem {
  const item: ContentItem = { id, kind, target, fr };
  if (options.alt?.length) item.frAlt = options.alt;
  if (options.targetAlt?.length) item.targetAlt = options.targetAlt;
  if (options.tr) item.translit = options.tr;
  if (options.pos) item.pos = options.pos;
  if (options.gender) item.gender = options.gender;
  if (options.ex) item.example = options.ex;
  if (options.exFr) item.exampleFr = options.exFr;
  if (options.note) item.note = options.note;
  if (options.skills) item.skills = options.skills;
  return item;
}

/** Un mot isolé. */
export const w = (id: string, target: string, fr: string, options?: ItemOptions): ContentItem =>
  build('word', id, target, fr, options);

/** Une expression figée : « comment ça va ? », « s'il vous plaît ». */
export const p = (id: string, target: string, fr: string, options?: ItemOptions): ContentItem =>
  build('phrase', id, target, fr, options);

/** Une phrase complète, support privilégié des exercices de reconstitution. */
export const s = (id: string, target: string, fr: string, options?: ItemOptions): ContentItem =>
  build('sentence', id, target, fr, options);

export function lesson(id: string, title: string, goal: string, level: CefrLevel, items: ContentItem[]): Lesson {
  return { id, title, goal, level, items };
}

export function unit(id: string, title: string, description: string, icon: string, lessons: Lesson[]): Unit {
  return { id, title, description, icon, lessons };
}

export function pack(pack: ContentPack): ContentPack {
  return pack;
}

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------

export interface ValidationIssue {
  severity: 'error' | 'warning';
  path: string;
  message: string;
}

/**
 * Vérifie l'intégrité d'un pack.
 *
 * Les erreurs bloquent la construction ; les avertissements signalent une
 * qualité pédagogique dégradée sans empêcher la publication. La distinction
 * compte : refuser de démarrer parce qu'un mot n'a pas d'exemple découragerait
 * toute contribution.
 */
export function validatePack(candidate: ContentPack): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenItemIds = new Set<string>();
  const seenLessonIds = new Set<string>();
  const seenUnitIds = new Set<string>();
  // Pour repérer deux mots différents traduits pareil : un QCM sur l'un d'eux
  // aurait alors deux bonnes réponses.
  const byFrench = new Map<string, string[]>();

  const error = (path: string, message: string) => issues.push({ severity: 'error', path, message });
  const warn = (path: string, message: string) => issues.push({ severity: 'warning', path, message });

  if (candidate.version < 1) {
    error(candidate.language, 'La version du pack doit être supérieure ou égale à 1.');
  }
  if (candidate.profile.code !== candidate.language) {
    error(candidate.language, 'Le code du profil ne correspond pas à celui du pack.');
  }
  if (candidate.units.length === 0) {
    error(candidate.language, 'Le pack ne contient aucune unité.');
  }

  for (const unit of candidate.units) {
    if (seenUnitIds.has(unit.id)) error(unit.id, 'Identifiant d’unité en double.');
    seenUnitIds.add(unit.id);
    if (unit.lessons.length === 0) warn(unit.id, 'Unité sans aucune leçon.');

    for (const lesson of unit.lessons) {
      if (seenLessonIds.has(lesson.id)) error(lesson.id, 'Identifiant de leçon en double.');
      seenLessonIds.add(lesson.id);

      if (lesson.items.length === 0) {
        error(lesson.id, 'Leçon sans aucun élément.');
      } else if (lesson.items.length > 14) {
        // Au-delà d'une douzaine d'éléments, une leçon devient indigeste et
        // décourage de la commencer.
        warn(lesson.id, `Leçon trop longue (${lesson.items.length} éléments, 14 maximum conseillé).`);
      }

      for (const item of lesson.items) {
        const path = item.id;
        if (seenItemIds.has(item.id)) error(path, 'Identifiant d’élément en double.');
        seenItemIds.add(item.id);

        if (!item.id.startsWith(`${candidate.language}.`)) {
          error(path, `L’identifiant doit commencer par « ${candidate.language}. ».`);
        }
        if (!item.target.trim()) error(path, 'Forme cible vide.');
        if (!item.fr.trim()) error(path, 'Traduction française vide.');

        if (candidate.profile.needsTransliteration && !item.translit) {
          error(path, 'Translittération obligatoire pour cette langue.');
        }
        if (item.example && !item.exampleFr) {
          warn(path, 'Exemple sans traduction française.');
        }
        if (item.kind === 'sentence' && item.target.trim().split(/\s+/).length < 2) {
          warn(path, 'Élément déclaré « phrase » mais ne contenant qu’un mot.');
        }

        const key = item.fr.trim().toLocaleLowerCase();
        byFrench.set(key, [...(byFrench.get(key) ?? []), item.id]);
      }
    }
  }

  for (const [french, ids] of byFrench) {
    if (ids.length > 1) {
      warn(
        ids.join(', '),
        `Traduction « ${french} » partagée par ${ids.length} éléments : un choix multiple sur l’un d’eux aurait plusieurs bonnes réponses.`,
      );
    }
  }

  return issues;
}

/** Tous les éléments d'un pack, à plat. */
export function allItems(candidate: ContentPack): ContentItem[] {
  return candidate.units.flatMap((u) => u.lessons.flatMap((l) => l.items));
}

/** Nombre total d'éléments d'un pack. */
export function countItems(candidate: ContentPack): number {
  return allItems(candidate).length;
}

/** Index identifiant → élément, pour le planificateur de session. */
export function indexItems(candidate: ContentPack): Map<string, ContentItem> {
  return new Map(allItems(candidate).map((item) => [item.id, item]));
}

/** Ordre d'introduction par défaut : celui du pack, unité par unité. */
export function defaultOrder(candidate: ContentPack): string[] {
  return allItems(candidate).map((item) => item.id);
}

export type { LanguageCode };
