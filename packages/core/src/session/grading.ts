/**
 * Correction des réponses libres.
 *
 * La qualité de ce module détermine à elle seule si l'application est vivable.
 * Une correction trop stricte — « ¡Hola! » refusé parce qu'il manque le point
 * d'exclamation inversé — est la première cause d'abandon des applications de
 * langue. Une correction trop laxiste n'apprend rien.
 *
 * La réponse : trois verdicts au lieu de deux. Juste, juste-avec-une-remarque
 * (accent, casse, ponctuation), et presque (une faute de frappe). Seul le
 * quatrième cas est un échec.
 */

/** Diacritiques arabes (tashkil) et signes d'allongement à ignorer. */
const ARABIC_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

export type Verdict = 'exact' | 'accentOnly' | 'typo' | 'wrong';

export interface GradingResult {
  verdict: Verdict;
  /** Vrai si la réponse doit compter comme réussie. */
  accepted: boolean;
  /** Réponse de référence la plus proche de ce qu'a écrit l'apprenant. */
  closest: string;
  /** Message à afficher, en français, ou `null` si la réponse est parfaite. */
  hint: string | null;
}

/**
 * Normalisation de surface : casse, espaces, ponctuation.
 * Ne touche pas aux accents — c'est l'étape suivante, et la distinction entre
 * les deux est précisément ce qui permet le verdict « attention à l'accent ».
 */
export function normalizeSurface(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase()
    .normalize('NFC')
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[.,!?;:¡¿"'«»…]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Normalisation profonde : on retire en plus les accents latins et on unifie
 * les variantes graphiques de l'arabe (formes du alef, taa marbuta, ya final),
 * que les claviers et les usages écrivent indifféremment.
 */
export function normalizeDeep(input: string): string {
  return (
    normalizeSurface(input)
      .normalize('NFD')
      // Diacritiques latins, puis hamza / madda / wasla arabes. Ces derniers
      // n'apparaissent qu'après décomposition : « أ » est un caractère unique
      // en NFC et ne devient « ا » + hamza qu'en NFD. Les oublier ici, c'est
      // refuser « اهلا » écrit sans hamza, orthographe pourtant courante.
      .replace(/[̀-ͯٓ-ٰٕ]/g, '')
      .normalize('NFC')
      .replace(/ٱ/g, 'ا') // alif wasla → alif
      .replace(/ة/g, 'ه') // taa marbuta → haa
      .replace(/ى/g, 'ي') // alif maqsura → yaa
  );
}

/**
 * Distance de Damerau-Levenshtein (variante « optimal string alignment »).
 *
 * On compte l'inversion de deux lettres voisines pour une seule faute, et non
 * deux. C'est décisif en pratique : l'inversion est de très loin la faute de
 * frappe la plus fréquente — « gracias » tapé « gracais », « perché » tapé
 * « perhcé ». Avec Levenshtein simple, ces réponses sont comptées fausses et
 * l'apprenant se sent puni pour un doigt trop rapide.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Trois lignes suffisent : l'inversion ne regarde que deux rangs en arrière.
  let twoBack = new Array<number>(b.length + 1);
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        current[j - 1]! + 1, // insertion
        previous[j]! + 1, // suppression
        previous[j - 1]! + cost, // substitution
      );
      // Inversion de deux caractères adjacents.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, twoBack[j - 2]! + 1);
      }
      current[j] = value;
    }
    [twoBack, previous, current] = [previous, current, twoBack];
  }

  return previous[b.length]!;
}

/**
 * Tolérance aux fautes de frappe, proportionnelle à la longueur.
 * Un mot de trois lettres n'a droit à aucune faute — sinon « mal » et « mar »
 * deviendraient équivalents, ce qui est faux et pédagogiquement nuisible.
 */
export function typoTolerance(length: number): number {
  if (length <= 4) return 0;
  if (length <= 8) return 1;
  return 2;
}

/**
 * Corrige une réponse libre contre un ensemble de réponses acceptées.
 *
 * @param answer     ce qu'a écrit l'apprenant
 * @param accepted   réponses de référence, la première étant la forme canonique
 * @param strict     désactive la tolérance aux fautes de frappe (dictée)
 */
export function grade(answer: string, accepted: string[], strict = false): GradingResult {
  const candidates = accepted.filter((a) => a.trim().length > 0);
  if (candidates.length === 0) {
    return { verdict: 'wrong', accepted: false, closest: '', hint: null };
  }

  const surface = normalizeSurface(answer);
  const deep = normalizeDeep(answer);

  // 1. Correspondance exacte, aux espaces et à la ponctuation près.
  for (const candidate of candidates) {
    if (normalizeSurface(candidate) === surface) {
      return { verdict: 'exact', accepted: true, closest: candidate, hint: null };
    }
  }

  // 2. Correspondance aux accents près.
  for (const candidate of candidates) {
    if (normalizeDeep(candidate) === deep) {
      return {
        verdict: 'accentOnly',
        accepted: true,
        closest: candidate,
        hint: `Presque : attention à l'orthographe exacte — ${candidate}`,
      };
    }
  }

  // 3. Faute de frappe : on cherche la référence la plus proche.
  let closest = candidates[0]!;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = levenshtein(normalizeDeep(candidate), deep);
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = candidate;
    }
  }

  if (!strict && bestDistance <= typoTolerance(normalizeDeep(closest).length)) {
    return {
      verdict: 'typo',
      accepted: true,
      closest,
      hint: `Faute de frappe : la réponse attendue est « ${closest} »`,
    };
  }

  return {
    verdict: 'wrong',
    accepted: false,
    closest,
    hint: `La réponse attendue était « ${closest} »`,
  };
}
