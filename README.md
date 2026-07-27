# Polyglotte

Application d'apprentissage des langues pour francophones — **anglais, espagnol, italien et arabe tunisien**.

Conçue pour une chose précise : tenir plusieurs mois. Apprendre une langue ne se
fait pas en une semaine, et la plupart des applications sont bâties pour
l'engagement quotidien plutôt que pour la mémorisation à long terme. Celle-ci
fait l'inverse — quitte à sembler moins généreuse le premier jour.

## Ce qui la distingue

**Un mot n'est pas une carte, c'est quatre cartes.** Reconnaître, produire,
écouter et prononcer sont planifiés séparément, chacun avec sa propre mémoire.
C'est ce qui évite l'apprenant qui reconnaît tout et ne sait pas parler — le
défaut le plus courant des applications de langue.

**FSRS plutôt que SM-2.** L'algorithme de répétition espacée modélise
explicitement la mémoire par sa stabilité et sa difficulté, et planifie chaque
révision à l'instant où la probabilité de rappel atteint la cible. Environ 20 à
30 % de révisions en moins à rétention égale. Sur plusieurs mois, c'est la
différence entre une charge tenable et un abandon.

**Le plafond de nouvelles cartes est un garde-fou, pas un frein.** Chaque
nouvel élément introduit aujourd'hui représente environ huit révisions sur
l'année. Sans plafond, une semaine enthousiaste fabrique un mois de corvée.
L'écran de progression affiche la charge des quatorze prochains jours,
précisément pour voir venir le mur avant d'être dedans.

**Priorité à l'oral.** L'objectif est de comprendre et de parler, pas de
rédiger. La compréhension et l'expression orales sont surpondérées dans la
sélection des exercices.

**Local-first, hors-ligne, sans compte.** Toute la progression vit dans le
navigateur. Aucun serveur à maintenir, aucun coût, et l'application fonctionne
dans le métro comme à l'étranger.

## Les quatre langues

| Langue | Éléments | Audio | Reconnaissance vocale |
|---|---|---|---|
| 🇬🇧 Anglais | 120 | voix du système | oui |
| 🇪🇸 Espagnol | 120 | voix du système | oui |
| 🇮🇹 Italien | 117 | voix du système | oui |
| 🇹🇳 Arabe tunisien | 120 | limité (voir ci-dessous) | non |

L'**arabe tunisien** est traité comme une langue à part entière, pas comme une
variante de l'arabe standard : `barcha`, `9addèch`, `ghodwa`, `zouz`. Apprendre
l'arabe standard pour parler à Tunis reviendrait à apprendre le latin pour
commander un café à Rome. Chaque élément porte une translittération latine à
côté de l'écriture arabe, pour ne pas exiger l'alphabet avant de savoir dire
bonjour.

Aucun navigateur ne propose de voix de synthèse ni de reconnaissance vocale pour
la derja. L'application le détecte, l'annonce, et bascule sur l'auto-évaluation
plutôt que de produire des exercices muets. C'est une limite réelle, documentée
dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Utiliser l'application

**En ligne :** https://amaramilan2-arch.github.io/language/

C'est une PWA : sur téléphone, le menu du navigateur propose « Ajouter à
l'écran d'accueil ». Elle s'installe alors comme une application normale et
fonctionne ensuite sans réseau. C'est l'usage pour lequel elle est conçue —
réviser dans les transports.

Votre progression reste sur votre appareil, y compris en ligne : rien n'est
envoyé nulle part, et il n'y a pas de compte à créer.

## Développer

```bash
npm install
npm run dev          # http://localhost:5173
```

Autres commandes :

```bash
npm test             # tests unitaires du moteur et du contenu
npm run typecheck    # vérification des types de tout le dépôt
npm run build        # construction de la PWA
npm run preview      # sert la version construite
npm run e2e          # parcours de bout en bout dans un vrai navigateur
```

Le parcours de bout en bout requiert un navigateur Playwright
(`npx playwright install chromium`) et une prévisualisation déjà lancée.

Chaque fusion sur `main` reconstruit et republie le site automatiquement. Le
chemin racine est fourni par la variable `BASE_PATH` : le site vit sous
`/language/` sur GitHub Pages, à la racine en local.

## Organisation

```
packages/core/       Moteur : FSRS, planificateur, correction, statistiques.
                     Aucune dépendance, aucune notion d'interface.
packages/content/    Packs de contenu et leur validation. Ajouter une langue
                     n'exige de toucher à aucun code.
apps/web/            PWA React : exercices, écrans, stockage, synthèse et
                     reconnaissance vocales.
docs/                Décisions d'architecture et feuille de route.
```

Le moteur est délibérément séparé de l'interface. Il est pur — horloge injectée,
aucun effet de bord — ce qui rend la logique pédagogique testable de façon
déterministe. C'est la principale raison pour laquelle ce projet pourra être
repris dans six mois sans tout casser.

## État actuel et suite

La phase 1 est terminée : moteur, contenu des quatre langues, application
complète et utilisable au quotidien. Les phases suivantes — audio enregistré par
des locuteurs natifs pour le tunisien, jeux courts, compréhension de dialogues,
synchronisation entre appareils — sont décrites dans
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Licence

Projet personnel, sans licence définie pour l'instant.
