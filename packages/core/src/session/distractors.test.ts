import { describe, expect, it } from 'vitest';
import { buildChoices, buildSentenceTokens, createRng, pickDistractors, shuffle } from './distractors.js';
import type { ContentItem } from '../types/index.js';

const POOL: ContentItem[] = [
  { id: '1', kind: 'word', target: 'gato', fr: 'chat', pos: 'noun' },
  { id: '2', kind: 'word', target: 'perro', fr: 'chien', pos: 'noun' },
  { id: '3', kind: 'word', target: 'casa', fr: 'maison', pos: 'noun' },
  { id: '4', kind: 'word', target: 'comer', fr: 'manger', pos: 'verb' },
  { id: '5', kind: 'word', target: 'beber', fr: 'boire', pos: 'verb' },
  { id: '6', kind: 'word', target: 'rojo', fr: 'rouge', pos: 'adj' },
  { id: '7', kind: 'sentence', target: 'el gato duerme en la casa', fr: 'le chat dort dans la maison' },
  { id: '8', kind: 'word', target: 'libro', fr: 'livre', pos: 'noun' },
  { id: '9', kind: 'word', target: 'agua', fr: 'eau', pos: 'noun' },
];

describe('générateur pseudo-aléatoire', () => {
  it('est reproductible à graine égale', () => {
    const a = createRng(42);
    const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('produit des valeurs dans [0, 1[', () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('mélange', () => {
  it('conserve tous les éléments', () => {
    const result = shuffle([1, 2, 3, 4, 5], createRng(1));
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('ne modifie pas le tableau d’origine', () => {
    const original = [1, 2, 3];
    shuffle(original, createRng(1));
    expect(original).toEqual([1, 2, 3]);
  });
});

describe('distracteurs', () => {
  const gato = POOL[0]!;

  it('n’inclut jamais la bonne réponse', () => {
    const distractors = pickDistractors(gato, POOL, 'recognize', 3, createRng(1));
    expect(distractors.some((d) => d.id === gato.id)).toBe(false);
  });

  it('en fournit le nombre demandé', () => {
    expect(pickDistractors(gato, POOL, 'recognize', 3, createRng(2))).toHaveLength(3);
  });

  it('n’inclut pas un synonyme de la bonne réponse', () => {
    // « salut » est une traduction acceptée de « hola » : le proposer comme
    // mauvaise réponse rendrait la question insoluble.
    const hola: ContentItem = {
      id: 'h',
      kind: 'word',
      target: 'hola',
      fr: 'bonjour',
      frAlt: ['salut'],
      pos: 'phrase',
    };
    const pool: ContentItem[] = [
      ...POOL,
      { id: 's', kind: 'word', target: 'saludo', fr: 'salut', pos: 'phrase' },
    ];
    const distractors = pickDistractors(hola, pool, 'recognize', 4, createRng(3));
    expect(distractors.some((d) => d.fr === 'salut')).toBe(false);
  });

  it('privilégie la même catégorie grammaticale', () => {
    // Sur plusieurs graines, les verbes doivent dominer pour un verbe.
    let sameKind = 0;
    for (let seed = 0; seed < 20; seed++) {
      const distractors = pickDistractors(POOL[3]!, POOL, 'recognize', 2, createRng(seed));
      sameKind += distractors.filter((d) => d.pos === 'verb').length;
    }
    expect(sameKind).toBeGreaterThan(10);
  });

  it('ne mélange pas un mot isolé et une phrase entière', () => {
    let sentences = 0;
    for (let seed = 0; seed < 20; seed++) {
      const distractors = pickDistractors(gato, POOL, 'recognize', 3, createRng(seed));
      sentences += distractors.filter((d) => d.kind === 'sentence').length;
    }
    expect(sentences).toBeLessThan(10);
  });

  it('ne plante pas quand le vivier est trop petit', () => {
    const tiny = [gato, POOL[1]!];
    const distractors = pickDistractors(gato, tiny, 'recognize', 3, createRng(4));
    expect(distractors.length).toBeLessThanOrEqual(1);
  });
});

describe('options de QCM', () => {
  it('contient la bonne réponse à l’index annoncé', () => {
    for (let seed = 0; seed < 30; seed++) {
      const { options, correctIndex } = buildChoices(POOL[0]!, POOL, 'recognize', 4, createRng(seed));
      expect(options).toHaveLength(4);
      expect(options[correctIndex]?.id).toBe(POOL[0]!.id);
    }
  });

  it('ne place pas la bonne réponse toujours au même endroit', () => {
    const positions = new Set<number>();
    for (let seed = 0; seed < 30; seed++) {
      positions.add(buildChoices(POOL[0]!, POOL, 'recognize', 4, createRng(seed)).correctIndex);
    }
    expect(positions.size).toBeGreaterThan(1);
  });

  it('ne propose aucun doublon', () => {
    const { options } = buildChoices(POOL[0]!, POOL, 'recognize', 4, createRng(11));
    expect(new Set(options.map((o) => o.id)).size).toBe(options.length);
  });
});

describe('reconstitution de phrase', () => {
  it('découpe en mots', () => {
    const { tokens } = buildSentenceTokens('el gato duerme', createRng(1));
    expect(tokens).toEqual(['el', 'gato', 'duerme']);
  });

  it('propose un ordre différent de la solution', () => {
    const { tokens, shuffled } = buildSentenceTokens('el gato duerme en la casa', createRng(5));
    expect(shuffled.join(' ')).not.toBe(tokens.join(' '));
    expect([...shuffled].sort()).toEqual([...tokens].sort());
  });

  it('gère un mot unique sans boucler', () => {
    const { tokens, shuffled } = buildSentenceTokens('hola', createRng(1));
    expect(tokens).toEqual(['hola']);
    expect(shuffled).toEqual(['hola']);
  });
});
