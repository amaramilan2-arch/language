import { describe, expect, it } from 'vitest';
import { computeStreak, dayKey, forecast, leeches, masteryBySkill, retentionStats } from './stats.js';
import type { CardMemory, ReviewLog } from '../types/index.js';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 5, 10, 14, 0, 0);

function memory(overrides: Partial<CardMemory>): CardMemory {
  return {
    id: 'x::recognize',
    language: 'en',
    itemId: 'x',
    skill: 'recognize',
    state: 'review',
    stability: 10,
    difficulty: 5,
    due: NOW,
    lastReview: NOW - DAY,
    reps: 3,
    lapses: 0,
    learningStep: 0,
    ...overrides,
  };
}

describe('série de jours', () => {
  const days = (offsets: number[]) => offsets.map((o) => dayKey(NOW - o * DAY, 0));

  it('vaut 0 sans aucune activité', () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    expect(computeStreak(days([0, 1, 2, 3]), NOW)).toBe(4);
  });

  it('ne casse pas la série le matin avant la première session', () => {
    // Point important : sans cette tolérance, l'application annoncerait
    // « série perdue » chaque matin au réveil.
    expect(computeStreak(days([1, 2, 3]), NOW)).toBe(3);
  });

  it('casse la série après deux jours d’absence', () => {
    expect(computeStreak(days([2, 3, 4]), NOW)).toBe(0);
  });

  it('s’arrête au premier trou', () => {
    expect(computeStreak(days([0, 1, 3, 4]), NOW)).toBe(2);
  });

  it('ignore les doublons', () => {
    expect(computeStreak([...days([0, 1]), ...days([0, 1])], NOW)).toBe(2);
  });
});

describe('maîtrise par compétence', () => {
  it('classe les cartes selon leur stabilité', () => {
    const memories = [
      memory({ id: 'a', state: 'new', lastReview: null }),
      memory({ id: 'b', stability: 2 }),
      memory({ id: 'c', stability: 12 }),
      memory({ id: 'd', stability: 90 }),
    ];
    const recognize = masteryBySkill(memories, 'en', NOW).find((m) => m.skill === 'recognize')!;
    expect(recognize.untouched).toBe(1);
    expect(recognize.learning).toBe(1);
    expect(recognize.solid).toBe(1);
    expect(recognize.mastered).toBe(1);
  });

  it('renvoie toujours les quatre compétences, même vides', () => {
    expect(masteryBySkill([], 'en', NOW)).toHaveLength(4);
  });

  it('n’agrège que la langue demandée', () => {
    const memories = [memory({ id: 'a' }), memory({ id: 'b', language: 'es' })];
    const total = masteryBySkill(memories, 'en', NOW).reduce(
      (sum, m) => sum + m.learning + m.solid + m.mastered + m.untouched,
      0,
    );
    expect(total).toBe(1);
  });

  it('calcule une probabilité de rappel moyenne plausible', () => {
    const recognize = masteryBySkill([memory({ stability: 10, lastReview: NOW })], 'en', NOW).find(
      (m) => m.skill === 'recognize',
    )!;
    expect(recognize.averageRetrievability).toBeGreaterThan(0.9);
    expect(recognize.averageRetrievability).toBeLessThanOrEqual(1);
  });
});

describe('prévision de charge', () => {
  it('répartit les cartes sur les jours à venir', () => {
    const memories = [
      memory({ id: 'a', due: NOW }),
      memory({ id: 'b', due: NOW + DAY }),
      memory({ id: 'c', due: NOW + DAY }),
      memory({ id: 'd', due: NOW + 5 * DAY }),
    ];
    const days = forecast(memories, 'en', NOW, 7);
    expect(days).toHaveLength(7);
    expect(days[0]?.count).toBe(1);
    expect(days[1]?.count).toBe(2);
    expect(days[5]?.count).toBe(1);
  });

  it('range les cartes en retard sur aujourd’hui', () => {
    const days = forecast([memory({ due: NOW - 10 * DAY })], 'en', NOW, 7);
    expect(days[0]?.count).toBe(1);
  });

  it('exclut les cartes jamais vues', () => {
    const days = forecast([memory({ state: 'new', due: NOW })], 'en', NOW, 7);
    expect(days.reduce((sum, d) => sum + d.count, 0)).toBe(0);
  });

  it('ignore les échéances au-delà de l’horizon', () => {
    const days = forecast([memory({ due: NOW + 90 * DAY })], 'en', NOW, 7);
    expect(days.reduce((sum, d) => sum + d.count, 0)).toBe(0);
  });
});

describe('taux de rétention', () => {
  function log(rating: 1 | 2 | 3 | 4, intervalDays: number, elapsedMs = 3000): ReviewLog {
    return {
      cardId: 'x::recognize',
      language: 'en',
      skill: 'recognize',
      rating,
      reviewedAt: NOW,
      elapsedMs,
      intervalDays,
      stabilityBefore: 5,
      stabilityAfter: 8,
      exercise: 'multipleChoice',
    };
  }

  it('vaut 0 sans historique', () => {
    expect(retentionStats([]).reviews).toBe(0);
  });

  it('exclut les premières découvertes du calcul', () => {
    // Rater un mot jamais vu n'est pas un oubli : le compter fausserait tout.
    const stats = retentionStats([log(1, 0), log(3, 5), log(3, 5)]);
    expect(stats.reviews).toBe(2);
    expect(stats.retention).toBe(1);
  });

  it('mesure la part de révisions réussies', () => {
    const stats = retentionStats([log(3, 5), log(3, 5), log(3, 5), log(1, 5)]);
    expect(stats.retention).toBeCloseTo(0.75);
  });

  it('calcule un temps de réponse médian', () => {
    const stats = retentionStats([log(3, 5, 1000), log(3, 5, 2000), log(3, 5, 9000)]);
    expect(stats.medianResponseMs).toBe(2000);
  });
});

describe('cartes récalcitrantes', () => {
  it('remonte celles qui échouent le plus souvent', () => {
    const memories = [
      memory({ id: 'facile', lapses: 0, reps: 10 }),
      memory({ id: 'penible', lapses: 8, reps: 10 }),
      memory({ id: 'moyen', lapses: 5, reps: 20 }),
    ];
    const result = leeches(memories, 'en');
    expect(result[0]?.id).toBe('penible');
    expect(result.some((m) => m.id === 'facile')).toBe(false);
  });

  it('respecte le seuil d’oublis', () => {
    expect(leeches([memory({ lapses: 2 })], 'en', 4)).toHaveLength(0);
  });
});
