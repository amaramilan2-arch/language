import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG,
  createMemory,
  currentRetrievability,
  nextIntervalDays,
  previewIntervals,
  retrievability,
  review,
} from './fsrs.js';
import { RATINGS, cardId } from '../types/index.js';
import type { CardMemory } from '../types/index.js';

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1, 9, 0, 0);

function newCard(): CardMemory {
  return createMemory(cardId('en.hello', 'recognize'), 'en.hello', 'recognize', 'en', T0);
}

/** Enchaîne plusieurs notes espacées de l'intervalle proposé à chaque étape. */
function drill(memory: CardMemory, ratings: number[], start = T0): CardMemory {
  let current = memory;
  let now = start;
  for (const rating of ratings) {
    const result = review(current, rating as 1 | 2 | 3 | 4, now);
    current = result.memory;
    now = current.due;
  }
  return current;
}

describe('courbe d’oubli', () => {
  it('vaut 1 juste après la révision', () => {
    expect(retrievability(0, 10)).toBeCloseTo(1, 10);
  });

  it('vaut exactement 0,9 lorsque le temps écoulé égale la stabilité', () => {
    for (const stability of [1, 5, 20, 365]) {
      expect(retrievability(stability, stability)).toBeCloseTo(0.9, 6);
    }
  });

  it('décroît strictement avec le temps', () => {
    let previous = 1;
    for (const days of [1, 2, 5, 10, 30, 100]) {
      const r = retrievability(days, 10);
      expect(r).toBeLessThan(previous);
      previous = r;
    }
  });

  it('est plus élevée pour une carte plus stable, à durée égale', () => {
    expect(retrievability(10, 50)).toBeGreaterThan(retrievability(10, 5));
  });
});

describe('intervalle cible', () => {
  it('est cohérent avec la rétention visée : R(intervalle) ≈ rétention voulue', () => {
    for (const stability of [1, 7, 30, 200]) {
      const interval = nextIntervalDays(stability, DEFAULT_CONFIG);
      const achieved = retrievability(interval, stability);
      // L'arrondi au jour introduit un écart, d'autant plus grand que la
      // stabilité est faible. On vérifie l'ordre de grandeur.
      expect(Math.abs(achieved - DEFAULT_CONFIG.desiredRetention)).toBeLessThan(0.12);
    }
  });

  it('vise plus court quand on exige une rétention plus haute', () => {
    const strict = nextIntervalDays(50, { ...DEFAULT_CONFIG, desiredRetention: 0.97 });
    const relaxed = nextIntervalDays(50, { ...DEFAULT_CONFIG, desiredRetention: 0.8 });
    expect(strict).toBeLessThan(relaxed);
  });

  it('ne descend jamais sous un jour ni au-dessus du plafond', () => {
    expect(nextIntervalDays(0.001, DEFAULT_CONFIG)).toBe(1);
    expect(nextIntervalDays(1e9, DEFAULT_CONFIG)).toBe(DEFAULT_CONFIG.maximumIntervalDays);
  });
});

describe('première présentation', () => {
  it('initialise stabilité et difficulté', () => {
    const { memory } = review(newCard(), RATINGS.good, T0);
    expect(memory.stability).toBeGreaterThan(0);
    expect(memory.difficulty).toBeGreaterThanOrEqual(1);
    expect(memory.difficulty).toBeLessThanOrEqual(10);
    expect(memory.reps).toBe(1);
    expect(memory.state).toBe('review');
  });

  it('donne un intervalle croissant avec la note', () => {
    const again = review(newCard(), RATINGS.again, T0).intervalDays;
    const hard = review(newCard(), RATINGS.hard, T0).intervalDays;
    const good = review(newCard(), RATINGS.good, T0).intervalDays;
    const easy = review(newCard(), RATINGS.easy, T0).intervalDays;
    expect(again).toBe(0);
    expect(hard).toBeLessThanOrEqual(good);
    expect(good).toBeLessThan(easy);
  });

  it('donne une difficulté décroissante avec la note', () => {
    const hard = review(newCard(), RATINGS.hard, T0).memory.difficulty;
    const good = review(newCard(), RATINGS.good, T0).memory.difficulty;
    const easy = review(newCard(), RATINGS.easy, T0).memory.difficulty;
    expect(hard).toBeGreaterThan(good);
    expect(good).toBeGreaterThan(easy);
  });

  it('place une carte ratée en apprentissage, due immédiatement', () => {
    const { memory } = review(newCard(), RATINGS.again, T0);
    expect(memory.state).toBe('learning');
    expect(memory.due).toBe(T0);
  });
});

describe('révisions successives', () => {
  it('allonge l’intervalle à chaque réussite', () => {
    let memory = review(newCard(), RATINGS.good, T0).memory;
    let previous = 0;
    for (let i = 0; i < 6; i++) {
      const result = review(memory, RATINGS.good, memory.due);
      expect(result.intervalDays).toBeGreaterThan(previous);
      previous = result.intervalDays;
      memory = result.memory;
    }
  });

  it('atteint plusieurs mois après une dizaine de bonnes réponses', () => {
    const memory = drill(newCard(), Array<number>(10).fill(RATINGS.good));
    expect(memory.stability).toBeGreaterThan(90);
  });

  it('n’augmente jamais la stabilité après un oubli', () => {
    const trained = drill(newCard(), [RATINGS.good, RATINGS.good, RATINGS.good]);
    const forgotten = review(trained, RATINGS.again, trained.due);
    expect(forgotten.memory.stability).toBeLessThanOrEqual(trained.stability);
    expect(forgotten.memory.lapses).toBe(1);
    expect(forgotten.memory.state).toBe('relearning');
  });

  it('compte les oublis sans jamais les décompter', () => {
    const memory = drill(newCard(), [
      RATINGS.good,
      RATINGS.again,
      RATINGS.good,
      RATINGS.again,
      RATINGS.good,
    ]);
    expect(memory.lapses).toBe(2);
  });

  it('crédite moins une révision le jour même qu’une révision espacée', () => {
    const base = review(newCard(), RATINGS.good, T0).memory;
    const sameDay = review(base, RATINGS.good, T0 + 3_600_000).memory.stability;
    const spaced = review(base, RATINGS.good, base.due).memory.stability;
    expect(sameDay).toBeLessThan(spaced);
  });

  it('accorde un intervalle plus long à une carte facile qu’à une carte difficile', () => {
    const base = drill(newCard(), [RATINGS.good, RATINGS.good]);
    const hard = review(base, RATINGS.hard, base.due).intervalDays;
    const easy = review(base, RATINGS.easy, base.due).intervalDays;
    expect(easy).toBeGreaterThan(hard);
  });
});

describe('difficulté', () => {
  it('reste bornée dans [1, 10] même après une longue série de « à revoir »', () => {
    const memory = drill(newCard(), Array<number>(30).fill(RATINGS.again));
    expect(memory.difficulty).toBeGreaterThanOrEqual(1);
    expect(memory.difficulty).toBeLessThanOrEqual(10);
    expect(Number.isFinite(memory.stability)).toBe(true);
  });

  it('reste bornée après une longue série de « facile »', () => {
    const memory = drill(newCard(), Array<number>(30).fill(RATINGS.easy));
    expect(memory.difficulty).toBeGreaterThanOrEqual(1);
    expect(memory.difficulty).toBeLessThanOrEqual(10);
  });

  it('revient vers la moyenne : une carte très difficile se réhabilite', () => {
    const struggling = drill(newCard(), Array<number>(8).fill(RATINGS.again));
    const recovered = drill(struggling, Array<number>(8).fill(RATINGS.easy), struggling.due);
    expect(recovered.difficulty).toBeLessThan(struggling.difficulty);
  });
});

describe('pureté et robustesse', () => {
  it('ne modifie pas la mémoire passée en argument', () => {
    const memory = newCard();
    const snapshot = JSON.stringify(memory);
    review(memory, RATINGS.good, T0);
    expect(JSON.stringify(memory)).toBe(snapshot);
  });

  it('est déterministe : deux appels identiques donnent le même résultat', () => {
    const memory = drill(newCard(), [RATINGS.good, RATINGS.hard]);
    const a = review(memory, RATINGS.good, memory.due);
    const b = review(memory, RATINGS.good, memory.due);
    expect(a.memory).toEqual(b.memory);
  });

  it('gère une carte laissée en friche pendant un an', () => {
    const memory = drill(newCard(), [RATINGS.good, RATINGS.good, RATINGS.good]);
    const atDue = currentRetrievability(memory, memory.due);
    const result = review(memory, RATINGS.again, memory.lastReview! + 365 * DAY);

    expect(Number.isFinite(result.memory.stability)).toBe(true);
    expect(result.memory.stability).toBeGreaterThan(0);
    // La probabilité de rappel doit avoir nettement chuté sous la cible. Elle ne
    // s'effondre pas à zéro pour autant : la courbe d'oubli de FSRS suit une loi
    // de puissance, à queue lourde, qui modélise le fait qu'un souvenir ancien
    // se dégrade de plus en plus lentement. C'est voulu, et c'est ce qui permet
    // à une reprise après une longue pause de ne pas tout redémarrer à zéro.
    expect(result.retrievabilityBefore).toBeLessThan(atDue - 0.25);
    expect(result.retrievabilityBefore).toBeLessThan(0.7);
  });
});

describe('prévisualisation des intervalles', () => {
  it('propose les quatre notes dans l’ordre croissant', () => {
    const memory = drill(newCard(), [RATINGS.good, RATINGS.good]);
    const preview = previewIntervals(memory, memory.due);
    expect(preview[RATINGS.again]).toBe(0);
    expect(preview[RATINGS.hard]).toBeLessThanOrEqual(preview[RATINGS.good]);
    expect(preview[RATINGS.good]).toBeLessThanOrEqual(preview[RATINGS.easy]);
  });
});

describe('probabilité de rappel courante', () => {
  it('vaut 0 pour une carte jamais vue', () => {
    expect(currentRetrievability(newCard(), T0)).toBe(0);
  });

  it('décroît à mesure que l’échéance est dépassée', () => {
    const memory = review(newCard(), RATINGS.good, T0).memory;
    const atDue = currentRetrievability(memory, memory.due);
    const late = currentRetrievability(memory, memory.due + 30 * DAY);
    expect(late).toBeLessThan(atDue);
  });
});
