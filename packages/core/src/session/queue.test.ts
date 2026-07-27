import { describe, expect, it } from 'vitest';
import { DEFAULT_QUEUE_OPTIONS, SessionQueue } from './queue.js';
import type { SessionEntry, SessionPlan } from './planner.js';
import { RATINGS } from '../types/index.js';
import type { ExerciseKind, Skill } from '../types/index.js';

function entry(
  itemId: string,
  exercise: ExerciseKind = 'multipleChoice',
  skill: Skill = 'recognize',
): SessionEntry {
  return {
    cardId: `${itemId}::${skill}`,
    itemId,
    skill,
    language: 'es',
    exercise,
    isNew: false,
    isFirstEncounter: false,
  };
}

function plan(entries: SessionEntry[]): SessionPlan {
  return { language: 'es', entries, remainingDue: 0 };
}

describe('file de session', () => {
  it('sert les entrées dans l’ordre du plan', () => {
    const queue = new SessionQueue(plan([entry('a'), entry('b'), entry('c')]));
    expect(queue.peek()?.itemId).toBe('a');
    queue.submit(RATINGS.good);
    expect(queue.peek()?.itemId).toBe('b');
  });

  it('se termine quand toutes les entrées sont validées', () => {
    const queue = new SessionQueue(plan([entry('a'), entry('b')]));
    queue.submit(RATINGS.good);
    queue.submit(RATINGS.good);
    expect(queue.isFinished).toBe(true);
    expect(queue.peek()).toBeNull();
    expect(queue.progress.completed).toBe(2);
  });

  it('réinjecte une carte ratée plus loin dans la session', () => {
    const entries = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => entry(id));
    const queue = new SessionQueue(plan(entries));

    queue.submit(RATINGS.again); // « a » est raté
    // Elle ne doit pas revenir immédiatement…
    expect(queue.peek()?.itemId).toBe('b');

    // …mais bien réapparaître après quelques exercices.
    const seen: string[] = [];
    while (!queue.isFinished && seen.length < 20) {
      seen.push(queue.peek()!.itemId);
      queue.submit(RATINGS.good);
    }
    expect(seen).toContain('a');
  });

  it('repropose un exercice plus facile après un échec', () => {
    const queue = new SessionQueue(
      plan([
        entry('a', 'typeAnswer', 'produce'),
        entry('b'),
        entry('c'),
        entry('d'),
        entry('e'),
      ]),
    );
    queue.submit(RATINGS.again);

    let reappearance: SessionEntry | undefined;
    while (!queue.isFinished) {
      const current = queue.peek()!;
      if (current.itemId === 'a') {
        reappearance = current;
        break;
      }
      queue.submit(RATINGS.good);
    }
    // Écrire de mémoire a échoué : on redescend à la reconstitution par blocs.
    expect(reappearance?.exercise).toBe('buildSentence');
  });

  it('abandonne une carte après trop d’échecs, plutôt que de boucler', () => {
    const entries = Array.from({ length: 6 }, (_, i) => entry(`w${i}`));
    const queue = new SessionQueue(plan(entries));

    let iterations = 0;
    // On rate systématiquement la première carte servie.
    while (!queue.isFinished && iterations < 200) {
      queue.submit(RATINGS.again);
      iterations += 1;
    }
    expect(queue.isFinished).toBe(true);
    expect(iterations).toBeLessThan(200);
  });

  it('ne réinjecte pas au-delà du nombre maximal de tentatives', () => {
    const queue = new SessionQueue(plan([entry('a')]), {
      ...DEFAULT_QUEUE_OPTIONS,
      maxRetriesPerCard: 2,
    });

    let served = 0;
    while (!queue.isFinished && served < 10) {
      served += 1;
      queue.submit(RATINGS.again);
    }
    expect(served).toBe(3); // présentation initiale + 2 reprises
  });

  it('comptabilise réussites et échecs', () => {
    const queue = new SessionQueue(plan([entry('a'), entry('b'), entry('c')]));
    queue.submit(RATINGS.good);
    queue.submit(RATINGS.again);
    queue.submit(RATINGS.easy);
    expect(queue.progress.correct).toBe(2);
    expect(queue.progress.incorrect).toBe(1);
    expect(queue.progress.planned).toBe(3);
  });

  it('vide la file lors d’un abandon', () => {
    const queue = new SessionQueue(plan([entry('a'), entry('b')]));
    queue.abort();
    expect(queue.isFinished).toBe(true);
  });

  it('ne plante pas si l’on note une file déjà vide', () => {
    const queue = new SessionQueue(plan([]));
    expect(() => queue.submit(RATINGS.good)).not.toThrow();
    expect(queue.isFinished).toBe(true);
  });
});
