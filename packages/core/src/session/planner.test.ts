import { describe, expect, it } from 'vitest';
import { DEFAULT_SESSION_CONFIG, availableSkills, interleave, pickExercise, planSession } from './planner.js';
import type { Capabilities, PlannerInput, SessionEntry } from './planner.js';
import { createMemory, review } from '../srs/fsrs.js';
import { RATINGS, cardId } from '../types/index.js';
import type { CardMemory, ContentItem, LanguageProfile } from '../types/index.js';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 2, 15, 8, 0, 0);

const PROFILE: LanguageProfile = {
  code: 'es',
  name: 'Espagnol',
  flag: '🇪🇸',
  direction: 'ltr',
  bcp47: 'es-ES',
  hasNativeTts: true,
  hasNativeAsr: true,
  needsTransliteration: false,
};

const FULL_CAPS: Capabilities = {
  canPlayAudio: true,
  canRecognizeSpeech: true,
  hasMicrophone: true,
};

function makeItems(count: number): Map<string, ContentItem> {
  const map = new Map<string, ContentItem>();
  for (let i = 0; i < count; i++) {
    map.set(`es.w${i}`, {
      id: `es.w${i}`,
      kind: 'word',
      target: `palabra${i}`,
      fr: `mot${i}`,
      pos: 'noun',
    });
  }
  return map;
}

/** Fabrique une mémoire déjà due depuis `overdueDays` jours. */
function dueMemory(itemId: string, skill: 'recognize' | 'produce' | 'listen' | 'speak', overdueDays: number): CardMemory {
  const base = createMemory(cardId(itemId, skill), itemId, skill, 'es', NOW - 30 * DAY);
  const reviewed = review(base, RATINGS.good, NOW - 30 * DAY).memory;
  return { ...reviewed, due: NOW - overdueDays * DAY, reps: 3 };
}

function input(overrides: Partial<PlannerInput> = {}): PlannerInput {
  const items = overrides.items ?? makeItems(40);
  return {
    language: 'es',
    profile: PROFILE,
    items,
    memories: new Map(),
    newItemOrder: [...items.keys()],
    capabilities: FULL_CAPS,
    config: DEFAULT_SESSION_CONFIG,
    now: NOW,
    ...overrides,
  };
}

describe('compétences disponibles', () => {
  it('propose les quatre compétences quand tout est disponible', () => {
    expect(availableSkills(PROFILE, FULL_CAPS)).toHaveLength(4);
  });

  it('retire l’écoute quand aucun audio n’est disponible', () => {
    // Cas de l'arabe tunisien sans audio enregistré : un exercice d'écoute muet
    // serait un bug visible pour l'apprenant.
    const skills = availableSkills(PROFILE, { ...FULL_CAPS, canPlayAudio: false });
    expect(skills).not.toContain('listen');
  });

  it('garde l’expression orale sans reconnaissance vocale, via l’auto-évaluation', () => {
    const skills = availableSkills(PROFILE, { ...FULL_CAPS, canRecognizeSpeech: false });
    expect(skills).toContain('speak');
  });

  it('retire l’expression orale sans micro ni audio', () => {
    const skills = availableSkills(PROFILE, {
      canPlayAudio: false,
      canRecognizeSpeech: false,
      hasMicrophone: false,
    });
    expect(skills).not.toContain('speak');
    expect(skills).not.toContain('listen');
  });
});

describe('choix du format d’exercice', () => {
  const word: ContentItem = { id: 'x', kind: 'word', target: 'gato', fr: 'chat' };
  const sentence: ContentItem = { id: 'y', kind: 'sentence', target: 'el gato duerme', fr: 'le chat dort' };

  it('montre avant de tester lors de la toute première rencontre', () => {
    expect(pickExercise('recognize', undefined, word, FULL_CAPS)).toBe('flashcard');
  });

  it('passe au QCM une fois l’élément vu', () => {
    const memory = { ...dueMemory('x', 'recognize', 1), reps: 2 };
    expect(pickExercise('recognize', memory, word, FULL_CAPS)).toBe('multipleChoice');
  });

  it('fait reconstituer une phrase avant de la faire écrire', () => {
    const early = { ...dueMemory('y', 'produce', 1), reps: 1 };
    const late = { ...dueMemory('y', 'produce', 1), reps: 9 };
    expect(pickExercise('produce', early, sentence, FULL_CAPS)).toBe('buildSentence');
    expect(pickExercise('produce', late, sentence, FULL_CAPS)).toBe('typeAnswer');
  });

  it('n’impose la dictée qu’après plusieurs écoutes réussies', () => {
    const early = { ...dueMemory('x', 'listen', 1), reps: 1 };
    const late = { ...dueMemory('x', 'listen', 1), reps: 6 };
    expect(pickExercise('listen', early, word, FULL_CAPS)).toBe('listenChoice');
    expect(pickExercise('listen', late, word, FULL_CAPS)).toBe('dictation');
  });
});

describe('construction de la session', () => {
  it('respecte la taille visée', () => {
    const plan = planSession(input());
    expect(plan.entries.length).toBeLessThanOrEqual(DEFAULT_SESSION_CONFIG.targetCards);
    expect(plan.entries.length).toBeGreaterThan(0);
  });

  it('respecte strictement le plafond de nouvelles cartes', () => {
    const plan = planSession(input());
    const newOnes = plan.entries.filter((e) => e.isNew);
    expect(newOnes.length).toBeLessThanOrEqual(DEFAULT_SESSION_CONFIG.newCardLimit);
  });

  it('donne la priorité aux révisions dues sur les nouveautés', () => {
    // 20 cartes en retard : la session doit être saturée de révisions.
    const memories = new Map<string, CardMemory>();
    for (let i = 0; i < 20; i++) {
      const memory = dueMemory(`es.w${i}`, 'recognize', 20 - i);
      memories.set(memory.id, memory);
    }
    const plan = planSession(input({ memories }));
    const newOnes = plan.entries.filter((e) => e.isNew);
    expect(newOnes.length).toBeLessThanOrEqual(DEFAULT_SESSION_CONFIG.newCardLimit);
    expect(plan.entries.filter((e) => !e.isNew).length).toBeGreaterThanOrEqual(12);
  });

  it('traite les cartes les plus en retard en premier', () => {
    const memories = new Map<string, CardMemory>();
    const veryLate = dueMemory('es.w0', 'recognize', 40);
    const barelyLate = dueMemory('es.w1', 'recognize', 1);
    memories.set(veryLate.id, veryLate);
    memories.set(barelyLate.id, barelyLate);

    const plan = planSession(input({ memories, newItemOrder: [] }));
    const ids = plan.entries.map((e) => e.itemId);
    expect(ids.indexOf('es.w0')).toBeLessThan(ids.indexOf('es.w1'));
  });

  it('n’introduit jamais un élément par autre chose que la reconnaissance', () => {
    const plan = planSession(input());
    for (const entry of plan.entries.filter((e) => e.isFirstEncounter)) {
      expect(entry.skill).toBe('recognize');
      expect(entry.exercise).toBe('flashcard');
    }
  });

  it('signale les révisions dues qui n’ont pas tenu dans la session', () => {
    const memories = new Map<string, CardMemory>();
    for (let i = 0; i < 40; i++) {
      const memory = dueMemory(`es.w${i}`, 'recognize', 5);
      memories.set(memory.id, memory);
    }
    const plan = planSession(input({ memories }));
    expect(plan.remainingDue).toBeGreaterThan(0);
  });

  it('ignore les cartes dont l’élément a disparu du pack', () => {
    // Scénario réel : un pack met à jour son contenu et retire un mot.
    // La mémoire orpheline ne doit ni planter ni apparaître.
    const memories = new Map<string, CardMemory>();
    const orphan = dueMemory('es.supprime', 'recognize', 3);
    memories.set(orphan.id, orphan);
    const plan = planSession(input({ memories }));
    expect(plan.entries.some((e) => e.itemId === 'es.supprime')).toBe(false);
  });

  it('ne produit aucun exercice d’écoute quand l’audio est indisponible', () => {
    const memories = new Map<string, CardMemory>();
    for (let i = 0; i < 10; i++) {
      const memory = dueMemory(`es.w${i}`, 'listen', 3);
      memories.set(memory.id, memory);
    }
    const plan = planSession(
      input({ memories, capabilities: { ...FULL_CAPS, canPlayAudio: false } }),
    );
    expect(plan.entries.some((e) => e.skill === 'listen')).toBe(false);
  });

  it('ne renvoie rien quand il n’y a aucun contenu', () => {
    const plan = planSession(input({ items: new Map(), newItemOrder: [] }));
    expect(plan.entries).toHaveLength(0);
  });
});

describe('entrelacement', () => {
  function entry(itemId: string): SessionEntry {
    return {
      cardId: `${itemId}::recognize`,
      itemId,
      skill: 'recognize',
      language: 'es',
      exercise: 'multipleChoice',
      isNew: false,
      isFirstEncounter: false,
    };
  }

  it('éloigne deux exercices portant sur le même élément', () => {
    const entries = [
      entry('a'), entry('a'), entry('a'),
      entry('b'), entry('b'),
      entry('c'), entry('c'),
      entry('d'), entry('e'), entry('f'),
    ];
    const result = interleave(entries, 3);

    const positions = new Map<string, number>();
    for (const [index, item] of result.entries()) {
      const previous = positions.get(item.itemId);
      if (previous !== undefined) {
        expect(index - previous).toBeGreaterThanOrEqual(3);
      }
      positions.set(item.itemId, index);
    }
  });

  it('ne perd ni ne duplique aucune entrée', () => {
    const entries = [entry('a'), entry('a'), entry('b'), entry('c')];
    const result = interleave(entries, 3);
    expect(result).toHaveLength(entries.length);
    expect(result.filter((e) => e.itemId === 'a')).toHaveLength(2);
  });

  it('ne boucle pas quand l’écartement est impossible à satisfaire', () => {
    // Trois exercices sur le même mot, impossible de les espacer de 5 :
    // le comportement attendu est de renvoyer un ordre dégradé, pas de figer.
    const entries = [entry('a'), entry('a'), entry('a')];
    const result = interleave(entries, 5);
    expect(result).toHaveLength(3);
  });
});
