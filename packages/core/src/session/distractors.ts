/**
 * Génération des mauvaises réponses pour les QCM.
 *
 * Un distracteur tiré au hasard dans tout le lexique est immédiatement éliminé
 * par l'apprenant, qui répond juste sans rien savoir : l'exercice ne mesure et
 * n'apprend plus rien. Un bon distracteur est plausible — même catégorie
 * grammaticale, longueur voisine, souvent le même champ lexical — mais jamais
 * synonyme de la bonne réponse, sous peine d'exiger une réponse fausse.
 */

import type { ContentItem, Skill } from '../types/index.js';
import { normalizeDeep } from './grading.js';

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 * Une graine explicite rend les exercices reproductibles en test — impossible
 * de valider un générateur de distracteurs qui change à chaque exécution.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(array: readonly T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Face d'un élément présentée comme option de réponse. */
function face(item: ContentItem, skill: Skill): string {
  // En reconnaissance et en écoute, la réponse est le sens en français.
  // En production, la réponse est la forme dans la langue cible.
  return skill === 'produce' ? item.target : item.fr;
}

interface Scored {
  item: ContentItem;
  score: number;
}

/**
 * Choisit `count` distracteurs pour un élément donné.
 *
 * @param correct  l'élément dont on teste la connaissance
 * @param pool     les autres éléments disponibles (idéalement du même niveau)
 * @param skill    détermine quelle face sert de réponse
 * @param count    nombre de distracteurs souhaités
 * @param rng      source d'aléa, injectée pour la testabilité
 */
export function pickDistractors(
  correct: ContentItem,
  pool: readonly ContentItem[],
  skill: Skill,
  count: number,
  rng: () => number,
): ContentItem[] {
  const correctFace = normalizeDeep(face(correct, skill));
  // Les traductions alternatives sont aussi des bonnes réponses : les proposer
  // comme distracteurs rendrait l'exercice insoluble.
  const forbidden = new Set<string>([correctFace]);
  for (const alt of correct.frAlt ?? []) forbidden.add(normalizeDeep(alt));
  for (const alt of correct.targetAlt ?? []) forbidden.add(normalizeDeep(alt));

  const candidates: Scored[] = [];
  for (const item of pool) {
    if (item.id === correct.id) continue;
    const itemFace = face(item, skill);
    if (!itemFace) continue;
    const normalized = normalizeDeep(itemFace);
    if (forbidden.has(normalized)) continue;

    let score = 0;
    // Même catégorie grammaticale : le distracteur est grammaticalement possible.
    if (item.pos && correct.pos && item.pos === correct.pos) score += 3;
    // Même nature (mot / phrase) : on ne mélange pas un mot et une phrase entière.
    if (item.kind === correct.kind) score += 2;
    // Longueur voisine : sinon la bonne réponse se repère à l'œil.
    const delta = Math.abs(itemFace.length - face(correct, skill).length);
    if (delta <= 3) score += 2;
    else if (delta <= 6) score += 1;
    // Bruit borné à moins d'un point : il départage les candidats de qualité
    // équivalente sans jamais faire passer un mauvais distracteur devant un bon.
    // C'est ce qui donne de la variété d'une session à l'autre — l'appelant
    // change de graine à chaque présentation — sans dégrader l'exercice.
    score += rng() * 0.9;

    candidates.push({ item, score });
  }

  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, count).map((c) => c.item);
}

/** Construit les options d'un QCM, bonne réponse comprise, mélangées. */
export function buildChoices(
  correct: ContentItem,
  pool: readonly ContentItem[],
  skill: Skill,
  optionCount: number,
  rng: () => number,
): { options: ContentItem[]; correctIndex: number } {
  const distractors = pickDistractors(correct, pool, skill, optionCount - 1, rng);
  const options = shuffle([correct, ...distractors], rng);
  return { options, correctIndex: options.findIndex((o) => o.id === correct.id) };
}

/**
 * Découpe une phrase en blocs pour l'exercice de reconstitution, puis les
 * mélange en garantissant que l'ordre proposé n'est pas déjà le bon.
 */
export function buildSentenceTokens(
  sentence: string,
  rng: () => number,
): { tokens: string[]; shuffled: string[] } {
  const tokens = sentence.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return { tokens, shuffled: tokens };

  let shuffled = shuffle(tokens, rng);
  let attempts = 0;
  while (shuffled.join(' ') === tokens.join(' ') && attempts < 8) {
    shuffled = shuffle(tokens, rng);
    attempts += 1;
  }
  return { tokens, shuffled };
}
