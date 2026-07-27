/**
 * Construction du plan de session.
 *
 * C'est ici que se joue la tenue dans la durée. Trois règles, toutes issues du
 * même constat — on n'abandonne pas une application parce qu'elle est trop
 * simple, on l'abandonne parce qu'un jour la dette de révisions devient un mur :
 *
 *  1. Plafond strict de nouvelles cartes. Chaque nouvelle carte introduite
 *     aujourd'hui, c'est environ huit révisions sur l'année. Sans plafond, une
 *     semaine enthousiaste crée un mois de corvée.
 *  2. Les révisions dues passent avant les nouveautés. Toujours. Apprendre du
 *     neuf en laissant filer l'ancien, c'est remplir un seau percé.
 *  3. Alternance des compétences et des exercices. Vingt QCM d'affilée sur le
 *     même thème, le cerveau décroche et la mémorisation chute.
 */

import type {
  CardMemory,
  ContentItem,
  ExerciseKind,
  LanguageCode,
  LanguageProfile,
  Skill,
} from '../types/index.js';
import { SKILLS, cardId } from '../types/index.js';

export interface SessionConfig {
  /** Nombre d'exercices visé pour la session. */
  targetCards: number;
  /** Nombre maximum de cartes inédites introduites dans cette session. */
  newCardLimit: number;
  /** Poids relatif de chaque compétence dans la sélection. */
  skillWeights: Record<Skill, number>;
  /**
   * Nombre minimum d'exercices intercalés avant de revoir le même élément de
   * contenu. Évite l'effet « je réponds de mémoire courte ».
   */
  minSpacingBetweenSameItem: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  targetCards: 20,
  newCardLimit: 8,
  // L'oral est délibérément privilégié : c'est l'objectif du projet, et c'est
  // aussi ce que la plupart des applications négligent au profit de l'écrit.
  skillWeights: { recognize: 1, produce: 1, listen: 1.4, speak: 1.2 },
  minSpacingBetweenSameItem: 3,
};

/** Ce que le moteur sait faire dans une langue donnée, matériellement. */
export interface Capabilities {
  /** La synthèse vocale est disponible (voix native ou audio enregistré). */
  canPlayAudio: boolean;
  /** La reconnaissance vocale est disponible. */
  canRecognizeSpeech: boolean;
  /** Le micro est autorisé (permet au moins l'auto-évaluation à l'oral). */
  hasMicrophone: boolean;
}

export interface PlannerInput {
  language: LanguageCode;
  profile: LanguageProfile;
  /** Éléments débloqués, indexés par identifiant. */
  items: Map<string, ContentItem>;
  /** Mémoire existante, indexée par identifiant de carte. */
  memories: Map<string, CardMemory>;
  /** Ordre d'introduction des éléments encore jamais vus. */
  newItemOrder: string[];
  capabilities: Capabilities;
  config: SessionConfig;
  now: number;
}

export interface SessionEntry {
  cardId: string;
  itemId: string;
  skill: Skill;
  language: LanguageCode;
  exercise: ExerciseKind;
  /** Vrai si la carte n'a jamais été présentée. */
  isNew: boolean;
  /** Vrai s'il s'agit de la toute première rencontre avec cet élément. */
  isFirstEncounter: boolean;
}

export interface SessionPlan {
  language: LanguageCode;
  entries: SessionEntry[];
  /** Nombre de cartes dues restantes non traitées dans cette session. */
  remainingDue: number;
}

/**
 * Compétences réellement praticables compte tenu du matériel et de la langue.
 * L'arabe tunisien sans audio enregistré ne peut pas donner d'exercice d'écoute :
 * mieux vaut l'exclure proprement que produire un exercice muet.
 */
export function availableSkills(profile: LanguageProfile, caps: Capabilities): Skill[] {
  return SKILLS.filter((skill) => {
    if (skill === 'listen') return caps.canPlayAudio;
    // L'expression orale reste possible sans reconnaissance vocale : on repasse
    // alors en auto-évaluation, ce qui vaut infiniment mieux que rien.
    if (skill === 'speak') return caps.hasMicrophone || caps.canPlayAudio;
    return true;
  });
}

/**
 * Choix du format d'exercice pour une carte donnée.
 *
 * La progression est graduée : on reconnaît avant de produire, on choisit avant
 * d'écrire. Présenter une dictée sur un mot vu une seule fois ne produit que de
 * la frustration.
 */
export function pickExercise(
  skill: Skill,
  memory: CardMemory | undefined,
  item: ContentItem,
  caps: Capabilities,
): ExerciseKind {
  const reps = memory?.reps ?? 0;
  const isSentence = item.kind === 'sentence' || item.kind === 'phrase';

  switch (skill) {
    case 'recognize':
      // Première rencontre : on montre, on ne teste pas.
      if (reps === 0) return 'flashcard';
      return 'multipleChoice';

    case 'produce':
      // Une phrase se reconstitue par blocs avant de s'écrire de mémoire.
      if (isSentence) return reps < 4 ? 'buildSentence' : 'typeAnswer';
      return reps < 2 ? 'multipleChoice' : 'typeAnswer';

    case 'listen':
      // La dictée n'arrive qu'une fois le mot solidement reconnu à l'oreille.
      return reps < 3 ? 'listenChoice' : 'dictation';

    case 'speak':
      return 'speakRepeat';

    default: {
      const _exhaustive: never = skill;
      void _exhaustive;
      void caps;
      return 'flashcard';
    }
  }
}

/** Compétences applicables à un élément donné. */
function skillsForItem(item: ContentItem, allowed: Skill[]): Skill[] {
  const declared = item.skills;
  if (!declared) return allowed;
  return allowed.filter((s) => declared.includes(s));
}

/**
 * Assemble la session.
 *
 * L'ordre final n'est pas l'ordre de sélection : on sélectionne par priorité
 * (échéances les plus anciennes d'abord), puis on entrelace pour que deux cartes
 * du même élément ne se suivent jamais.
 */
export function planSession(input: PlannerInput): SessionPlan {
  const { items, memories, config, now, capabilities, profile } = input;
  const allowedSkills = availableSkills(profile, capabilities);

  // --- 1. Les révisions dues, de la plus en retard à la plus récente ---------
  const due: CardMemory[] = [];
  for (const memory of memories.values()) {
    if (memory.language !== input.language) continue;
    if (memory.state === 'new') continue;
    if (memory.due > now) continue;
    if (!items.has(memory.itemId)) continue; // élément retiré du pack
    if (!allowedSkills.includes(memory.skill)) continue;
    due.push(memory);
  }
  due.sort((a, b) => a.due - b.due);

  const entries: SessionEntry[] = [];
  const dueQuota = Math.max(0, config.targetCards - Math.min(config.newCardLimit, config.targetCards));
  // Les révisions peuvent occuper toute la session si elles sont nombreuses :
  // on ne sacrifie jamais une révision due pour caser de la nouveauté.
  const dueTaken = due.slice(0, Math.max(dueQuota, config.targetCards - config.newCardLimit));

  for (const memory of dueTaken) {
    const item = items.get(memory.itemId);
    if (!item) continue;
    entries.push({
      cardId: memory.id,
      itemId: memory.itemId,
      skill: memory.skill,
      language: input.language,
      exercise: pickExercise(memory.skill, memory, item, capabilities),
      isNew: false,
      isFirstEncounter: false,
    });
  }

  // --- 2. Compléter avec de la nouveauté, dans la limite du plafond ----------
  const budget = config.targetCards - entries.length;
  const newBudget = Math.min(config.newCardLimit, Math.max(0, budget));
  const weightedSkills = orderSkillsByWeight(allowedSkills, config.skillWeights);

  let introduced = 0;
  for (const itemId of input.newItemOrder) {
    if (introduced >= newBudget) break;
    const item = items.get(itemId);
    if (!item) continue;

    const itemSkills = skillsForItem(item, weightedSkills);
    if (itemSkills.length === 0) continue;

    // On n'introduit jamais un élément par autre chose que la reconnaissance :
    // demander de produire un mot qu'on n'a jamais vu n'apprend rien.
    const firstSkill: Skill = itemSkills.includes('recognize') ? 'recognize' : itemSkills[0]!;
    const id = cardId(itemId, firstSkill);
    if (memories.has(id) && memories.get(id)!.state !== 'new') continue;

    entries.push({
      cardId: id,
      itemId,
      skill: firstSkill,
      language: input.language,
      exercise: 'flashcard',
      isNew: true,
      isFirstEncounter: true,
    });
    introduced += 1;
  }

  // --- 3. Étoffer avec les cartes non encore dues mais les plus fragiles -----
  // Si la session reste courte (peu de révisions, plafond de nouveautés atteint),
  // on remplit avec les cartes dont la probabilité de rappel est la plus basse.
  if (entries.length < config.targetCards) {
    const seen = new Set(entries.map((e) => e.cardId));
    const upcoming = [...memories.values()]
      .filter(
        (m) =>
          m.language === input.language &&
          m.state !== 'new' &&
          !seen.has(m.id) &&
          items.has(m.itemId) &&
          allowedSkills.includes(m.skill),
      )
      .sort((a, b) => a.due - b.due)
      .slice(0, config.targetCards - entries.length);

    for (const memory of upcoming) {
      const item = items.get(memory.itemId)!;
      entries.push({
        cardId: memory.id,
        itemId: memory.itemId,
        skill: memory.skill,
        language: input.language,
        exercise: pickExercise(memory.skill, memory, item, capabilities),
        isNew: false,
        isFirstEncounter: false,
      });
    }
  }

  return {
    language: input.language,
    entries: interleave(entries, config.minSpacingBetweenSameItem),
    remainingDue: Math.max(0, due.length - dueTaken.length),
  };
}

/** Trie les compétences par poids décroissant, de façon déterministe. */
function orderSkillsByWeight(skills: Skill[], weights: Record<Skill, number>): Skill[] {
  return [...skills].sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
}

/**
 * Réordonne pour éloigner les entrées portant sur le même élément.
 *
 * Algorithme glouton : on parcourt la liste et, si l'entrée courante est trop
 * proche d'une précédente sur le même élément, on va chercher plus loin la
 * première entrée acceptable. Si aucune ne convient, on garde l'ordre initial
 * — mieux vaut une session légèrement imparfaite qu'une boucle infinie.
 */
export function interleave(entries: SessionEntry[], minSpacing: number): SessionEntry[] {
  if (minSpacing <= 0 || entries.length < 2) return entries;

  const pool = [...entries];
  const result: SessionEntry[] = [];
  const lastSeenAt = new Map<string, number>();

  while (pool.length > 0) {
    let chosenIndex = 0;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i]!;
      const last = lastSeenAt.get(candidate.itemId);
      if (last === undefined || result.length - last >= minSpacing) {
        chosenIndex = i;
        break;
      }
    }
    const [chosen] = pool.splice(chosenIndex, 1);
    if (!chosen) break;
    lastSeenAt.set(chosen.itemId, result.length);
    result.push(chosen);
  }

  return result;
}
