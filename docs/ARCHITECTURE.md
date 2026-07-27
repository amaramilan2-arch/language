# Architecture et décisions

Ce document explique **pourquoi** le projet est bâti ainsi. Le code dit
comment ; ces pages disent ce qui a été écarté et à quel prix. C'est ce qui
permet de reprendre le projet dans six mois sans refaire les mêmes arbitrages.

---

## 1. La contrainte qui gouverne tout : durer

L'objectif énoncé n'est pas « une application d'apprentissage des langues »,
c'est « une application qu'on n'abandonne pas au bout d'une semaine ». Ce n'est
pas la même chose, et cela change presque toutes les décisions.

Les applications de langue échouent rarement par manque de contenu. Elles
échouent selon trois modes, dans cet ordre de fréquence :

1. **Le mur de révisions.** L'apprenant enthousiaste apprend 40 mots par jour la
   première semaine. Trois semaines plus tard, il doit en réviser 300
   quotidiennement, il ne le fait pas, l'arriéré enfle, et il abandonne devant
   un compteur à quatre chiffres.
2. **L'illusion de progression.** On accumule des points et des mots « vus »,
   mais on ne sait toujours pas commander un café. Le jour où on s'en aperçoit,
   la motivation s'effondre d'un coup.
3. **La friction.** Il faut du réseau, un compte, une publicité à regarder,
   trois tapes pour démarrer. Chaque friction fait perdre les jours où l'envie
   était déjà faible — et ce sont ceux-là qui font ou défont une habitude.

Chaque décision ci-dessous vise l'un de ces trois modes.

---

## 2. Le choix pédagogique central : une carte par compétence

**Décision.** Un élément de contenu engendre jusqu'à quatre cartes indépendantes
— reconnaître, produire, écouter, prononcer — chacune avec sa propre stabilité,
sa propre difficulté et sa propre échéance.

**Pourquoi.** Savoir qu'`agua` signifie « eau » et savoir produire `agua` quand
on veut de l'eau sont deux compétences distinctes, acquises à des rythmes
différents, et qui s'oublient différemment. Les applications qui ne planifient
qu'une carte par mot testent presque toujours la plus facile — la
reconnaissance. D'où le résultat classique : après six mois, on comprend
beaucoup et on ne produit rien.

**Le prix.** Quatre fois plus de cartes à planifier, donc quatre fois plus de
révisions pour le même vocabulaire. C'est assumé : c'est le coût réel de savoir
parler, et le masquer ne le supprime pas, il le reporte.

**Conséquence sur la progression.** L'écran de progression affiche la maîtrise
compétence par compétence, jamais un chiffre global. Un chiffre global
masquerait exactement le déséquilibre que ce découpage sert à révéler.

---

## 3. FSRS plutôt que SM-2

**Décision.** Implémentation de FSRS-5, dans `packages/core/src/srs/fsrs.ts`.

**Pourquoi.** SM-2 — l'algorithme historique d'Anki, celui que copient la
plupart des applications — ne modélise qu'un facteur de facilité multiplicatif.
Il ne sait pas répondre à « quelle est la probabilité que je m'en souvienne
aujourd'hui ». FSRS modélise la mémoire par deux variables, la stabilité
(combien de temps le souvenir tient) et la difficulté (à quel point il résiste),
et place la révision à l'instant où la probabilité de rappel atteint une cible
choisie. À rétention égale, cela représente environ 20 à 30 % de révisions en
moins.

Sur un mois, la différence est anecdotique. Sur huit mois, c'est ce qui sépare
vingt minutes par jour de quarante — et quarante minutes, on ne les tient pas.

**Le prix.** Dix-neuf paramètres au lieu de deux, des formules qu'on ne peut pas
vérifier de tête, et un risque réel d'erreur silencieuse : un exposant mal placé
ne plante pas, il dégrade la planification sans que personne ne s'en aperçoive
avant des mois. D'où les 26 tests dédiés, qui vérifient les propriétés
mathématiques du modèle — la courbe d'oubli passe bien par 0,9 quand le temps
écoulé égale la stabilité, un oubli n'augmente jamais l'intervalle, la
difficulté reste bornée après trente échecs consécutifs — et pas seulement des
valeurs attendues codées en dur.

**Un point contre-intuitif, vérifié par un test.** La courbe d'oubli de FSRS
suit une loi de puissance, non une exponentielle. Une carte de 36 jours de
stabilité laissée un an garde environ 55 % de probabilité de rappel, pas 5 %.
C'est voulu : les souvenirs anciens se dégradent de plus en plus lentement.
C'est aussi ce qui permet à une reprise après une longue pause de ne pas tout
recommencer à zéro — cas fréquent et décisif pour un projet qui doit survivre
aux vacances.

**Écarté.** Réimplémenter SM-2 « parce que c'est plus simple à déboguer ». La
simplicité aurait porté sur le code, pas sur l'expérience, et c'est l'expérience
qui décide de l'abandon.

---

## 4. Séparation des échelles de temps

**Décision.** FSRS raisonne en **jours**. La file de session raisonne en
**nombre d'exercices**. Les deux ne se rencontrent jamais dans le même module.

**Pourquoi.** Une carte ratée ne doit pas revenir demain, elle doit revenir dans
quelques minutes, après quelques autres cartes intercalées. Mélanger « échéance
à 12 jours » et « remontrer dans 4 exercices » dans le même objet est l'erreur
classique de ce genre de code : on obtient une logique impossible à tester, où
un bogue de planification et un bogue d'ordre d'affichage se ressemblent.

Concrètement : `srs/fsrs.ts` calcule les échéances et ne connaît pas la notion de
session ; `session/queue.ts` gère la réinjection des cartes ratées et ne connaît
pas la notion de jour. Chacun est testable seul.

---

## 5. La correction à trois verdicts

**Décision.** Une réponse libre n'est pas jugée juste ou fausse, mais selon
quatre verdicts : exacte, correcte à l'accent près, correcte à une faute de
frappe près, ou fausse. Les trois premiers sont acceptés, les deux intermédiaires
avec un message.

**Pourquoi.** Une correction trop stricte est la première cause d'abandon des
applications de langue. Se voir refuser `¡Hola!` parce qu'il manque le point
d'exclamation inversé, ou `cafe` pour `café`, donne le sentiment d'être puni par
une machine bornée. Une correction trop laxiste n'apprend rien.

**Détails qui comptent.**

- La distance utilisée est celle de **Damerau-Levenshtein**, pas Levenshtein :
  l'inversion de deux lettres voisines compte pour une faute et non deux. C'est
  de très loin la faute de frappe la plus fréquente — `gracias` tapé `gracais`.
- La tolérance est **proportionnelle à la longueur**, et **nulle en dessous de
  cinq lettres**. Sans cela `mal` et `mar` deviendraient équivalents, ce qui est
  faux et enseigne activement une erreur.
- La **dictée est corrigée en mode strict** : y tolérer les fautes de frappe
  masquerait précisément ce que l'exercice mesure. L'accent y reste toutefois
  toléré — une faute d'accent n'est pas une faute d'écoute, et confondre les
  deux brouille le diagnostic.
- L'**arabe est normalisé** : diacritiques ignorés, variantes du alif unifiées,
  taa marbuta et haa confondus. La derja n'a pas d'orthographe fixée ; exiger une
  graphie précise reviendrait à noter au hasard.

---

## 6. Local-first, sans serveur

**Décision.** Toute la progression vit dans IndexedDB, sur l'appareil. Pas de
compte, pas d'API, pas de synchronisation.

**Pourquoi, dans l'ordre.**

1. **Fiabilité.** Une application qui dépend d'un serveur meurt le jour où le
   serveur s'arrête — et sur un projet personnel, c'est le mode de défaillance
   le plus probable, bien avant le bogue.
2. **Disponibilité.** Réviser tous les jours suppose de réviser dans le métro,
   en avion, à l'étranger sans forfait.
3. **Coût.** Zéro, indéfiniment. Aucune facture à surveiller, donc aucune raison
   d'éteindre le projet un jour.

**Le prix, réel.** Pas de synchronisation entre téléphone et ordinateur, et un
nettoyage un peu zélé du navigateur efface tout. D'où l'export et l'import de
sauvegarde, traités comme une fonctionnalité de première nécessité et non comme
un confort. L'import **fusionne** sur l'horodatage au lieu d'écraser : on
restaure presque toujours sur un appareil déjà utilisé, jamais sur une
installation vierge.

**Préparé pour la suite.** Chaque enregistrement porte un `updatedAt`, et toute
la couche d'accès est isolée dans `apps/web/src/db/repository.ts`. Ajouter une
synchronisation (phase 3) ne touchera que ce fichier.

---

## 7. Le cas de l'arabe tunisien

C'est la langue qui a demandé le plus de décisions particulières, et la seule où
la technique impose une limite qu'on ne peut pas contourner.

**La derja, pas l'arabe standard.** Le tunisien de la rue dit `9addèch` et non
`kam`, `barcha` et non `kathiran`, `ghodwa` et non `ghadan`. Enseigner l'arabe
standard pour parler à Tunis reviendrait à enseigner le latin pour commander un
café à Rome. Un test du dépôt vérifie la présence des marqueurs dialectaux dans
le pack, précisément pour empêcher une dérive lente vers le standard au fil des
ajouts.

**Translittération obligatoire.** Chaque élément porte une graphie latine à côté
de l'écriture arabe, et la validation refuse un élément qui en manque. Exiger de
déchiffrer l'alphabet arabe avant de pouvoir dire bonjour est le meilleur moyen
de faire abandonner. La convention est celle qu'utilisent les Tunisiens
eux-mêmes : `3` pour ع, `7` pour ح, `9` pour ق.

**La limite qu'on ne contourne pas.** Aucun navigateur ne propose de voix de
synthèse ni de reconnaissance vocale pour la derja. Trois options se
présentaient :

- *Prétendre que ça marche* en utilisant une voix d'arabe standard. Écarté : la
  prononciation serait fausse, et apprendre une prononciation fausse est pire
  que ne rien apprendre.
- *Supprimer les exercices oraux en tunisien.* Écarté : c'est précisément la
  langue où l'oral compte le plus, puisqu'elle ne s'écrit presque pas.
- *Détecter, annoncer, et basculer sur l'auto-évaluation.* **Retenu.**

Concrètement, le profil de langue déclare `hasNativeTts: false` et
`hasNativeAsr: false`. Le planificateur s'en sert pour ne produire aucun
exercice d'écoute qui resterait muet, et l'exercice de prononciation bascule sur
un mode où l'apprenant répète puis se juge — ce que fait n'importe qui
travaillant avec un enregistrement. La phase 2 remplacera ce repli par de
l'audio enregistré par des locuteurs natifs, qui est la vraie réponse.

**Sens d'écriture.** Toute la gestion du RTL et de la translittération est
concentrée dans un unique composant, `TargetText`. Éparpiller ces conditions
dans chaque exercice garantirait qu'un jour l'un d'eux affiche l'arabe à
l'envers sans que personne ne le remarque avant longtemps.

---

## 8. Contenu écrit à la main

**Décision.** Les 477 éléments sont rédigés, pas générés.

**Pourquoi.** Le contenu généré produit des traductions plates et des exemples
qui sonnent faux. En langue, c'est rédhibitoire : on retient ce qu'on entend
dire, pas ce qui est grammaticalement correct. `I'd like` avant `I would like`,
`ya3ayshek` avant `choukran`.

**Ce qui rend la chose tenable.** Un petit langage de définition (`w`, `p`, `s`
dans `packages/content/src/schema.ts`) réduit l'écriture à une ligne par
élément, et une validation automatique bloque en intégration continue :
identifiants uniques et préfixés, aucun champ vide, genre grammatical
obligatoire en espagnol et en italien, translittération obligatoire en tunisien.

**Un contrôle mérite une mention.** La validation signale deux éléments
partageant la même traduction française. Ce n'est pas du pédantisme : un choix
multiple construit sur l'un d'eux aurait alors deux bonnes réponses, et
l'apprenant serait compté en erreur pour une réponse juste. Ce genre de bogue est
invisible en relecture et évident en usage.

---

## 9. Ce qui a été délibérément écarté

**Gamification par points, ligues et vies.** Ces mécaniques produisent de
l'assiduité, pas de la mémorisation, et elles récompensent la vitesse — qui est
l'ennemi direct de la rétention. La seule reprise de ce registre est la série de
jours consécutifs, parce qu'elle mesure exactement la bonne chose : la
régularité. Elle tolère d'ailleurs que la journée en cours ne soit pas encore
faite, sans quoi l'application annoncerait « série perdue » tous les matins au
réveil.

**Un routeur.** Quatre écrans et une session modale ne le justifient pas. Une
session en cours ne doit surtout pas être interruptible par un bouton
« précédent » malencontreux.

**Un framework CSS.** Sur un projet destiné à durer, c'est une dette : montées
de version imposées, et une apparence finalement dictée par la bibliothèque.
Tout tient dans un fichier de 600 lignes.

**Un backend.** Voir section 6.

---

## 10. Où regarder en premier

| Question | Fichier |
|---|---|
| Comment les échéances sont-elles calculées ? | `packages/core/src/srs/fsrs.ts` |
| Comment une session est-elle composée ? | `packages/core/src/session/planner.ts` |
| Pourquoi ma réponse a-t-elle été refusée ? | `packages/core/src/session/grading.ts` |
| Comment ajouter une langue ? | `packages/content/src/schema.ts` |
| Où sont stockées les données ? | `apps/web/src/db/database.ts` |
| Comment l'audio est-il géré ? | `apps/web/src/speech/tts.ts` |
| Est-ce que l'ensemble s'assemble ? | `apps/web/e2e/smoke.mjs` |
