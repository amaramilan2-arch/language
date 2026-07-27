import { describe, expect, it } from 'vitest';
import { grade, levenshtein, normalizeDeep, normalizeSurface, typoTolerance } from './grading.js';

describe('normalisation de surface', () => {
  it('ignore casse, espaces et ponctuation', () => {
    expect(normalizeSurface('  ¡Hola!  ')).toBe('hola');
    expect(normalizeSurface('How are you?')).toBe('how are you');
    expect(normalizeSurface('Ça   va,  merci')).toBe('ça va merci');
  });

  it('conserve les accents', () => {
    expect(normalizeSurface('café')).toBe('café');
  });

  it('retire les diacritiques arabes', () => {
    expect(normalizeSurface('مَرْحَبا')).toBe('مرحبا');
  });
});

describe('normalisation profonde', () => {
  it('retire les accents latins', () => {
    expect(normalizeDeep('café')).toBe('cafe');
    expect(normalizeDeep('perché')).toBe('perche');
    expect(normalizeDeep('mañana')).toBe('manana');
  });

  it('unifie les variantes graphiques de l’arabe', () => {
    expect(normalizeDeep('أهلا')).toBe(normalizeDeep('اهلا'));
    expect(normalizeDeep('مدرسة')).toBe(normalizeDeep('مدرسه'));
  });
});

describe('distance de Levenshtein', () => {
  it('vaut 0 pour deux chaînes identiques', () => {
    expect(levenshtein('bonjour', 'bonjour')).toBe(0);
  });

  it('compte les substitutions, insertions et suppressions', () => {
    expect(levenshtein('chat', 'chats')).toBe(1);
    expect(levenshtein('chat', 'chien')).toBe(3);
    expect(levenshtein('', 'abc')).toBe(3);
  });

  it('est symétrique', () => {
    expect(levenshtein('gracias', 'garcias')).toBe(levenshtein('garcias', 'gracias'));
  });
});

describe('tolérance aux fautes de frappe', () => {
  it('est nulle sur les mots courts', () => {
    expect(typoTolerance(3)).toBe(0);
    expect(typoTolerance(4)).toBe(0);
  });

  it('croît avec la longueur', () => {
    expect(typoTolerance(7)).toBe(1);
    expect(typoTolerance(15)).toBe(2);
  });
});

describe('correction', () => {
  it('accepte une réponse exacte', () => {
    const result = grade('hola', ['hola']);
    expect(result.verdict).toBe('exact');
    expect(result.accepted).toBe(true);
    expect(result.hint).toBeNull();
  });

  it('accepte malgré la ponctuation et la casse', () => {
    expect(grade('¡Hola!', ['hola']).verdict).toBe('exact');
    expect(grade('Grazie.', ['grazie']).verdict).toBe('exact');
  });

  it('accepte une réponse alternative', () => {
    const result = grade('salut', ['bonjour', 'salut', 'coucou']);
    expect(result.accepted).toBe(true);
    expect(result.closest).toBe('salut');
  });

  it('accepte à l’accent près, en le signalant', () => {
    const result = grade('cafe', ['café']);
    expect(result.verdict).toBe('accentOnly');
    expect(result.accepted).toBe(true);
    expect(result.hint).toContain('café');
  });

  it('accepte une faute de frappe sur un mot long, en donnant la forme correcte', () => {
    const result = grade('gracais', ['gracias']);
    expect(result.verdict).toBe('typo');
    expect(result.accepted).toBe(true);
    expect(result.hint).toContain('gracias');
  });

  it('refuse une confusion entre deux mots courts distincts', () => {
    // Le point critique : « mal » et « mar » ne doivent pas être confondus,
    // sinon la correction enseigne une erreur.
    expect(grade('mar', ['mal']).accepted).toBe(false);
    expect(grade('pan', ['pain']).verdict).not.toBe('exact');
  });

  it('refuse une réponse hors sujet et indique l’attendu', () => {
    const result = grade('bonsoir', ['merci']);
    expect(result.accepted).toBe(false);
    expect(result.hint).toContain('merci');
  });

  it('n’accorde aucune tolérance en mode strict, réservé à la dictée', () => {
    expect(grade('gracais', ['gracias'], true).accepted).toBe(false);
    // L'accent reste toléré même en dictée : la faute d'accent n'est pas une
    // faute d'écoute, et sanctionner les deux ensemble brouille le diagnostic.
    expect(grade('cafe', ['café'], true).accepted).toBe(true);
  });

  it('gère une liste de réponses vide sans planter', () => {
    expect(grade('quoi', []).accepted).toBe(false);
    expect(grade('', ['merci']).accepted).toBe(false);
  });

  it('corrige l’arabe écrit sans voyelles courtes', () => {
    expect(grade('مرحبا', ['مَرْحَبا']).accepted).toBe(true);
  });
});
