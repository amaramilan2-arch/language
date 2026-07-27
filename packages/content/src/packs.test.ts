/**
 * Contrôle qualité des packs de contenu.
 *
 * Ces tests tournent en intégration continue et bloquent la fusion. L'intention
 * est précise : le contenu est la partie du projet qui grossira le plus, écrite
 * à la main, souvent tard le soir. C'est donc là que les fautes d'inattention
 * s'accumulent — un identifiant recopié, une traduction oubliée. Mieux vaut
 * qu'elles cassent la construction que l'apprentissage de quelqu'un.
 */

import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@polyglotte/core';
import { PACKS, PACK_ORDER } from './index.js';
import { allItems, countItems, defaultOrder, indexItems, validatePack } from './schema.js';

describe('couverture des langues', () => {
  it('fournit un pack pour chaque langue annoncée', () => {
    for (const language of LANGUAGES) {
      expect(PACKS[language], `pack manquant pour « ${language} »`).toBeDefined();
    }
  });

  it('affiche toutes les langues sur l’accueil, sans doublon', () => {
    expect([...PACK_ORDER].sort()).toEqual([...LANGUAGES].sort());
  });
});

describe.each(PACK_ORDER)('pack « %s »', (language) => {
  const candidate = PACKS[language];

  it('ne présente aucune erreur de validation', () => {
    const errors = validatePack(candidate).filter((i) => i.severity === 'error');
    expect(errors, errors.map((e) => `${e.path} : ${e.message}`).join('\n')).toEqual([]);
  });

  it('contient assez de matière pour plusieurs semaines', () => {
    // En dessous d'une centaine d'éléments, le contenu s'épuise avant que la
    // répétition espacée n'ait eu le temps de produire son effet.
    expect(countItems(candidate)).toBeGreaterThanOrEqual(100);
  });

  it('couvre les six unités thématiques communes', () => {
    expect(candidate.units).toHaveLength(6);
    for (const unit of candidate.units) {
      expect(unit.lessons.length).toBeGreaterThan(0);
      expect(unit.title.trim()).not.toBe('');
    }
  });

  it('utilise des identifiants uniques et correctement préfixés', () => {
    const ids = allItems(candidate).map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id.startsWith(`${language}.`)).toBe(true);
    }
  });

  it('commence par les salutations', () => {
    // L'ordre d'introduction est celui du pack : la première leçon rencontrée
    // doit être immédiatement utile, sinon on perd l'apprenant au premier jour.
    const first = candidate.units[0]?.lessons[0];
    expect(first?.level).toBe('A1');
    expect(first?.items.length).toBeGreaterThanOrEqual(5);
  });

  it('propose des phrases complètes, pas seulement du vocabulaire', () => {
    const items = allItems(candidate);
    const sentences = items.filter((item) => item.kind === 'sentence');
    // Sans phrases, on apprend des mots qu'on ne sait pas assembler.
    expect(sentences.length / items.length).toBeGreaterThan(0.25);
  });

  it('n’utilise que des phrases réellement composées de plusieurs mots', () => {
    for (const item of allItems(candidate)) {
      if (item.kind !== 'sentence') continue;
      expect(item.target.trim().split(/\s+/).length, item.id).toBeGreaterThan(1);
    }
  });

  it('ne laisse aucun champ vide', () => {
    for (const item of allItems(candidate)) {
      expect(item.target.trim(), item.id).not.toBe('');
      expect(item.fr.trim(), item.id).not.toBe('');
    }
  });

  it('fournit un index et un ordre d’introduction cohérents', () => {
    const index = indexItems(candidate);
    const order = defaultOrder(candidate);
    expect(index.size).toBe(order.length);
    for (const id of order) {
      expect(index.has(id), id).toBe(true);
    }
  });

  it('déclare un profil de langue exploitable', () => {
    const { profile } = candidate;
    expect(profile.code).toBe(language);
    expect(profile.bcp47).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    expect(['ltr', 'rtl']).toContain(profile.direction);
    expect(profile.flag.trim()).not.toBe('');
  });
});

describe('arabe tunisien', () => {
  const aeb = PACKS.aeb;

  it('translittère chaque élément', () => {
    // Sans translittération, l'apprenant doit apprendre l'alphabet arabe avant
    // de pouvoir dire bonjour. C'est le meilleur moyen de le faire abandonner.
    for (const item of allItems(aeb)) {
      expect(item.translit?.trim(), item.id).toBeTruthy();
    }
  });

  it('s’affiche de droite à gauche', () => {
    expect(aeb.profile.direction).toBe('rtl');
  });

  it('signale l’absence de synthèse et de reconnaissance vocales natives', () => {
    // Cette information n'est pas cosmétique : le planificateur s'en sert pour
    // ne pas produire d'exercice d'écoute qui resterait muet.
    expect(aeb.profile.hasNativeTts).toBe(false);
    expect(aeb.profile.hasNativeAsr).toBe(false);
  });

  it('emploie bien le dialecte et non l’arabe standard', () => {
    const targets = allItems(aeb).map((item) => item.target);
    // Marqueurs incontestables du tunisien, absents de l'arabe standard.
    for (const marker of ['برشا', 'قدّاش', 'غدوة', 'زوز', 'شنوّة']) {
      expect(targets.some((t) => t.includes(marker)), `marqueur « ${marker} » absent`).toBe(true);
    }
  });
});

describe('langues à genre grammatical', () => {
  it.each(['es', 'it'] as const)('renseigne le genre des noms en %s', (language) => {
    const nouns = allItems(PACKS[language]).filter((item) => item.pos === 'noun');
    expect(nouns.length).toBeGreaterThan(10);
    for (const noun of nouns) {
      // Apprendre un nom sans son genre, c'est devoir le réapprendre plus tard.
      expect(noun.gender, `${noun.id} sans genre`).toBeDefined();
    }
  });
});

describe('rapport de qualité', () => {
  it('récapitule le volume de chaque pack', () => {
    const report = PACK_ORDER.map((language) => {
      const candidate = PACKS[language];
      const items = allItems(candidate);
      const warnings = validatePack(candidate).filter((i) => i.severity === 'warning');
      return {
        langue: candidate.profile.name,
        éléments: items.length,
        mots: items.filter((i) => i.kind === 'word').length,
        expressions: items.filter((i) => i.kind === 'phrase').length,
        phrases: items.filter((i) => i.kind === 'sentence').length,
        notes: items.filter((i) => i.note).length,
        avertissements: warnings.length,
      };
    });
    // eslint-disable-next-line no-console
    console.table(report);
    expect(report.every((row) => row.éléments >= 100)).toBe(true);
  });
});
