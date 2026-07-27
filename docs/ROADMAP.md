# Feuille de route

Le projet est pensé pour se construire sur plusieurs mois, par étapes qui
laissent chacune une application utilisable. Aucune phase ne dépend d'une phase
ultérieure pour avoir du sens — c'est délibéré : un projet personnel s'arrête
souvent au milieu, et il vaut mieux qu'il s'arrête sur quelque chose qui marche.

---

## Phase 1 — Fondations ✅ terminée

L'application est utilisable au quotidien dans les quatre langues.

- Moteur FSRS-5, planificateur de session, correction à trois verdicts,
  statistiques. Aucune dépendance, entièrement testé.
- 477 éléments répartis sur quatre packs, six unités thématiques par langue.
- Sept formats d'exercice couvrant les quatre compétences.
- PWA installable, hors-ligne, stockage local, export et import de sauvegarde.
- Intégration continue : types, tests unitaires, validation du contenu,
  construction.

**Ce qu'on peut déjà faire :** apprendre sérieusement, tous les jours, sur
plusieurs mois. Le reste est de l'amélioration, pas du complément indispensable.

---

## Phase 2 — L'oral pour de bon

La priorité absolue, parce que c'est l'objectif du projet et le point où
l'implémentation actuelle est la plus faible.

**Audio enregistré pour l'arabe tunisien.** *Le chantier le plus important du
projet.* Aucune voix de synthèse n'existe pour la derja, et le repli actuel par
auto-évaluation est un pis-aller. Enregistrer 120 éléments avec un locuteur natif
règle définitivement la question. Un fichier par élément, servi depuis
`public/audio/aeb/`, précaché par le service worker. Le modèle de données le
prévoit déjà : il suffira de passer `hasNativeTts` à `true` et de brancher la
source audio.

**Débit naturel.** Les voix de synthèse articulent trop proprement. Une option
« vitesse naturelle » qui monte le débit à 1,0 sur les cartes déjà solides
prépare à la conversation réelle, où personne ne parle comme un manuel.

**Enregistrement et réécoute.** Permettre de s'enregistrer et de se comparer au
modèle, y compris quand la reconnaissance vocale est disponible. Entendre sa
propre voix à côté du modèle apprend davantage qu'un score.

**Compréhension de dialogues.** Deux à quatre répliques dans une situation
concrète — commander, demander son chemin — avec questions de compréhension.
C'est le pas qui sépare « je connais des mots » de « je suis la conversation ».

---

## Phase 3 — Continuité

**Synchronisation entre appareils.** Le manque le plus ressenti à l'usage :
réviser sur téléphone et consulter sur ordinateur. Le schéma est déjà prêt —
chaque enregistrement porte un `updatedAt`, la couche d'accès est isolée dans un
seul fichier. Une synchronisation par fichier chiffré déposé dans un espace de
stockage personnel évite d'introduire un serveur, et donc le mode de défaillance
que la phase 1 s'est employée à écarter.

**Rappels quotidiens.** Notification à une heure choisie, via l'API de
notifications. Sur la régularité, c'est probablement le levier le plus efficace
de toute cette liste.

**Reprise après absence.** Revenir sur 400 cartes en retard est décourageant au
point de faire abandonner définitivement. Un mode « reprise » qui étale
l'arriéré sur une semaine et priorise les cartes les plus utiles change tout —
c'est précisément le moment où l'on perd les gens.

---

## Phase 4 — Affiner

**Optimisation des paramètres FSRS.** Une fois quelques milliers de révisions
accumulées, les dix-neuf paramètres peuvent être réestimés sur l'historique
réel de l'apprenant. Gain attendu : encore 10 à 15 % de révisions en moins.
L'historique nécessaire est déjà journalisé depuis le premier jour.

**Traitement des cartes récalcitrantes.** `leeches()` les identifie déjà. Il
reste à les traiter autrement : proposer un moyen mnémotechnique, une image, une
phrase d'exemple différente. Les repasser en boucle dans l'exercice qui échoue
depuis trois semaines ne sert à rien.

**Jeux courts.** Associations chronométrées, intrus à trouver. À faire *après*
le reste, et jamais au détriment de la planification : ils divertissent, ils
n'enseignent pas. Une partie ne doit jamais remplacer une session de révision.

**Grammaire en contexte.** Fiches courtes déclenchées par un élément — la
négation tunisienne encadrante `ma…ch`, les doubles consonnes italiennes, le
subjonctif espagnol. Jamais de leçon de grammaire isolée : elle serait sautée.

---

## Phase 5 — Ouvrir

À n'envisager que si l'usage personnel tient sur plusieurs mois. Ouvrir une
application qu'on a soi-même abandonnée n'aurait aucun sens.

- Deux fois plus de contenu par langue, et un niveau B1.
- Éditeur de contenu, pour ajouter ses propres mots.
- Nouvelles langues — l'architecture le permet sans toucher au code : ajouter un
  pack suffit.
- Hébergement public, page d'accueil, mode démonstration.

---

## Ce qui restera hors périmètre

Décidé une fois pour éviter d'y revenir à chaque envie passagère.

- **Classements et ligues.** Produisent de l'assiduité, pas de la mémorisation,
  et récompensent la vitesse — ennemie directe de la rétention.
- **Vies, cœurs, énergie.** Punir l'erreur va contre le principe même de la
  répétition espacée, où l'erreur est le signal le plus utile.
- **Traduction automatique du contenu.** Voir `docs/ARCHITECTURE.md`, section 8.
- **Compte obligatoire.** L'application doit rester utilisable sans rien créer.
