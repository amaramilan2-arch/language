# Notes pour la reprise du projet

Mémo destiné à retrouver le contexte après plusieurs semaines sans y toucher.
Les décisions et leurs raisons sont dans `docs/ARCHITECTURE.md` ; ce fichier ne
couvre que les habitudes de travail.

## Commandes

```bash
npm install
npm run dev          # application en développement
npm test             # moteur + validation du contenu
npm run typecheck    # types de tout le dépôt (tsc --build)
npm run build        # PWA de production
npm run e2e          # parcours navigateur, exige une prévisualisation lancée
```

## Organisation

- `packages/core` — moteur pur : FSRS, planificateur, correction, statistiques.
  **Aucune dépendance, aucun import d'interface, aucune lecture d'horloge.**
  L'instant courant est toujours un paramètre. C'est ce qui rend la logique
  pédagogique testable de façon déterministe : ne pas déroger à cette règle.
- `packages/content` — packs de contenu. Ajouter une langue ne doit exiger
  aucune modification de code.
- `apps/web` — PWA React. Seul `src/db/repository.ts` parle à la base.

## Conventions

- **Langue du projet : le français.** Code, commentaires, messages de commit,
  interface. Le public visé est francophone et le projet est personnel.
- Les commentaires expliquent **pourquoi**, jamais **quoi**. Un commentaire qui
  paraphrase la ligne suivante est à supprimer.
- Chaque module non trivial s'ouvre sur un bloc expliquant son rôle et les
  arbitrages qui l'ont façonné.

## Ajouter du contenu

1. Ouvrir le pack concerné dans `packages/content/src/packs/`.
2. Utiliser `w()` pour un mot, `p()` pour une expression figée, `s()` pour une
   phrase complète.
3. `npm test` — la validation refuse un identifiant en double, un champ vide, un
   genre manquant en espagnol ou en italien, une translittération manquante en
   tunisien.
4. Chaque pack doit conserver plus d'un quart de phrases complètes : un test le
   vérifie. Sans phrases, on apprend des mots qu'on ne sait pas assembler.

## Ajouter une langue

1. Créer `packages/content/src/packs/<code>.ts` avec un `LanguageProfile`
   honnête — en particulier `hasNativeTts` et `hasNativeAsr`, dont le
   planificateur se sert pour ne pas produire d'exercice muet.
2. Déclarer le code dans `LANGUAGES` (`packages/core/src/types/index.ts`) et
   dans `PACKS` et `PACK_ORDER` (`packages/content/src/index.ts`).
3. Ajouter une valeur par défaut dans `newCardsPerSession`
   (`apps/web/src/db/database.ts`).

Aucun composant d'interface ne doit être modifié.

## Pièges déjà rencontrés

- **Chrome peuple `getVoices()` de façon asynchrone** et renvoie un tableau vide
  au premier appel. Toujours passer par `loadVoices()`.
- **Les paquets sont référencés par projet TypeScript.** Un `tsc --noEmit` sur
  `apps/web` seul échoue en `TS6305` ; utiliser `npm run typecheck`, qui
  construit les références.
- **Ne pas mélanger les échelles de temps.** FSRS raisonne en jours, la file de
  session en nombre d'exercices. Les garder dans des modules séparés.
- **La graine d'aléa doit changer à chaque présentation d'une carte.** Sinon un
  mot raté puis représenté affiche les mêmes distracteurs, et l'apprenant retient
  la position de la bonne réponse plutôt que le mot.
