/**
 * Pack d'anglais — niveau A1 vers A2.
 *
 * Priorité donnée à ce qui se dit vraiment plutôt qu'à ce qui s'enseigne
 * habituellement : « I'd like » avant « I would like », « Can I get » avant
 * « May I have ». L'objectif est de comprendre et de se faire comprendre, pas
 * de réussir un exercice de grammaire.
 */

import { lesson, p, pack, s, unit, w } from '../schema.js';
import type { ContentPack } from '@polyglotte/core';

export const EN: ContentPack = pack({
  language: 'en',
  version: 1,
  profile: {
    code: 'en',
    name: 'Anglais',
    flag: '🇬🇧',
    direction: 'ltr',
    bcp47: 'en-GB',
    hasNativeTts: true,
    hasNativeAsr: true,
    needsTransliteration: false,
  },
  units: [
    unit('en.u1', 'Premiers contacts', 'Saluer, se présenter, rester poli', '👋', [
      lesson('en.u1.l1', 'Saluer', 'Aborder quelqu’un et prendre congé', 'A1', [
        p('en.hello', 'hello', 'bonjour', { alt: ['salut'], pos: 'phrase' }),
        p('en.hi', 'hi', 'salut', { pos: 'phrase', note: 'Plus familier que « hello », très courant à l’oral.' }),
        p('en.good-morning', 'good morning', 'bonjour (le matin)', { pos: 'phrase' }),
        p('en.good-evening', 'good evening', 'bonsoir', { pos: 'phrase' }),
        p('en.goodbye', 'goodbye', 'au revoir', { alt: ['bye'], targetAlt: ['bye'], pos: 'phrase' }),
        p('en.see-you', 'see you later', 'à plus tard', { pos: 'phrase' }),
        p('en.how-are-you', 'how are you?', 'comment vas-tu ?', { alt: ['comment allez-vous ?'], pos: 'phrase' }),
        p('en.im-fine', "I'm fine, thanks", 'ça va, merci', { pos: 'phrase' }),
        p('en.nice-to-meet', 'nice to meet you', 'enchanté', { pos: 'phrase' }),
      ]),
      lesson('en.u1.l2', 'Politesse', 'Demander et remercier sans froisser', 'A1', [
        w('en.please', 'please', 's’il te plaît', { alt: ['s’il vous plaît'], pos: 'phrase' }),
        w('en.thank-you', 'thank you', 'merci', { targetAlt: ['thanks'], pos: 'phrase' }),
        p('en.youre-welcome', "you're welcome", 'de rien', { alt: ['je t’en prie'], pos: 'phrase' }),
        p('en.excuse-me', 'excuse me', 'excusez-moi', { pos: 'phrase', note: 'Pour aborder quelqu’un. « Sorry » sert à s’excuser d’une faute.' }),
        w('en.sorry', 'sorry', 'désolé', { pos: 'phrase' }),
        w('en.yes', 'yes', 'oui', { pos: 'adv' }),
        w('en.no', 'no', 'non', { pos: 'adv' }),
        s('en.s-help', 'Could you help me, please?', 'Pourriez-vous m’aider, s’il vous plaît ?'),
        s('en.s-no-problem', "That's no problem at all.", 'Ce n’est pas un problème du tout.'),
      ]),
      lesson('en.u1.l3', 'Se présenter', 'Dire qui l’on est et d’où l’on vient', 'A1', [
        p('en.my-name-is', 'my name is…', 'je m’appelle…', { pos: 'phrase' }),
        p('en.whats-your-name', "what's your name?", 'comment t’appelles-tu ?', { pos: 'phrase' }),
        p('en.im-french', "I'm French", 'je suis français', { pos: 'phrase' }),
        p('en.where-from', 'where are you from?', 'd’où viens-tu ?', { pos: 'phrase' }),
        s('en.s-i-live', 'I live in Paris.', 'J’habite à Paris.'),
        s('en.s-how-old', 'How old are you?', 'Quel âge as-tu ?'),
        s('en.s-i-work', 'I work in a bank.', 'Je travaille dans une banque.'),
        s('en.s-learning', "I'm learning English.", 'J’apprends l’anglais.'),
        s('en.s-speak-slowly', 'Could you speak more slowly?', 'Pourriez-vous parler plus lentement ?', {
          note: 'La phrase la plus utile du pack : elle sauve toutes les conversations.',
        }),
      ]),
    ]),

    unit('en.u2', 'Les gens', 'Parler de sa famille et des autres', '👨‍👩‍👧', [
      lesson('en.u2.l1', 'La famille', 'Nommer ses proches', 'A1', [
        w('en.family', 'family', 'famille', { pos: 'noun' }),
        w('en.mother', 'mother', 'mère', { targetAlt: ['mum'], pos: 'noun' }),
        w('en.father', 'father', 'père', { targetAlt: ['dad'], pos: 'noun' }),
        w('en.brother', 'brother', 'frère', { pos: 'noun' }),
        w('en.sister', 'sister', 'sœur', { pos: 'noun' }),
        w('en.son', 'son', 'fils', { pos: 'noun' }),
        w('en.daughter', 'daughter', 'fille (enfant)', { pos: 'noun' }),
        w('en.wife', 'wife', 'épouse', { pos: 'noun' }),
        w('en.husband', 'husband', 'mari', { pos: 'noun' }),
        s('en.s-big-family', 'I have a big family.', 'J’ai une grande famille.'),
      ]),
      lesson('en.u2.l2', 'Décrire quelqu’un', 'Dire comment sont les gens', 'A1', [
        w('en.friend', 'friend', 'ami', { pos: 'noun' }),
        w('en.man', 'man', 'homme', { pos: 'noun' }),
        w('en.woman', 'woman', 'femme', { pos: 'noun' }),
        w('en.child', 'child', 'enfant', { pos: 'noun' }),
        w('en.young', 'young', 'jeune', { pos: 'adj' }),
        w('en.old', 'old', 'vieux', { pos: 'adj' }),
        w('en.tall', 'tall', 'grand (taille)', { pos: 'adj' }),
        w('en.kind', 'kind', 'gentil', { pos: 'adj' }),
        s('en.s-my-sister', 'My sister is a teacher.', 'Ma sœur est enseignante.'),
      ]),
    ]),

    unit('en.u3', 'Manger et boire', 'Commander et se débrouiller à table', '🍽️', [
      lesson('en.u3.l1', 'Au café', 'Commander une boisson', 'A1', [
        w('en.water', 'water', 'eau', { pos: 'noun' }),
        w('en.coffee', 'coffee', 'café', { pos: 'noun' }),
        w('en.tea', 'tea', 'thé', { pos: 'noun' }),
        w('en.beer', 'beer', 'bière', { pos: 'noun' }),
        w('en.bread', 'bread', 'pain', { pos: 'noun' }),
        p('en.id-like', "I'd like…", 'je voudrais…', { pos: 'phrase', note: 'Contraction de « I would like ». Bien plus courant à l’oral que la forme longue.' }),
        s('en.s-coffee-please', "I'd like a coffee, please.", 'Je voudrais un café, s’il vous plaît.'),
        s('en.s-the-bill', 'Could I have the bill, please?', 'Pourrais-je avoir l’addition, s’il vous plaît ?'),
        s('en.s-water-tap', 'A glass of tap water, please.', 'Un verre d’eau du robinet, s’il vous plaît.'),
      ]),
      lesson('en.u3.l2', 'Au restaurant', 'Choisir et payer', 'A2', [
        w('en.breakfast', 'breakfast', 'petit-déjeuner', { pos: 'noun' }),
        w('en.lunch', 'lunch', 'déjeuner', { pos: 'noun' }),
        w('en.dinner', 'dinner', 'dîner', { pos: 'noun' }),
        w('en.meat', 'meat', 'viande', { pos: 'noun' }),
        w('en.fish', 'fish', 'poisson', { pos: 'noun' }),
        w('en.vegetables', 'vegetables', 'légumes', { pos: 'noun' }),
        w('en.delicious', 'delicious', 'délicieux', { pos: 'adj' }),
        s('en.s-table-two', 'A table for two, please.', 'Une table pour deux, s’il vous plaît.'),
        s('en.s-vegetarian', "I'm vegetarian.", 'Je suis végétarien.'),
      ]),
    ]),

    unit('en.u4', 'Se déplacer', 'Trouver son chemin et prendre les transports', '🚉', [
      lesson('en.u4.l1', 'Demander son chemin', 'Ne jamais rester perdu', 'A1', [
        p('en.where-is', 'where is…?', 'où est… ?', { pos: 'phrase' }),
        w('en.left', 'left', 'gauche', { pos: 'noun' }),
        w('en.right', 'right', 'droite', { pos: 'noun' }),
        p('en.straight-on', 'straight on', 'tout droit', { pos: 'adv' }),
        w('en.near', 'near', 'proche', { pos: 'adj' }),
        w('en.far', 'far', 'loin', { pos: 'adv' }),
        s('en.s-where-station', 'Where is the train station?', 'Où est la gare ?'),
        s('en.s-lost', "I'm lost.", 'Je suis perdu.'),
        s('en.s-how-far', 'How far is it?', 'C’est à quelle distance ?'),
        s('en.s-turn-left', 'Turn left at the traffic lights.', 'Tournez à gauche au feu.'),
      ]),
      lesson('en.u4.l2', 'Les transports', 'Acheter un billet, monter à bord', 'A1', [
        w('en.train', 'train', 'train', { pos: 'noun' }),
        w('en.bus', 'bus', 'bus', { pos: 'noun' }),
        w('en.plane', 'plane', 'avion', { pos: 'noun' }),
        w('en.ticket', 'ticket', 'billet', { pos: 'noun' }),
        w('en.station', 'station', 'gare', { pos: 'noun' }),
        w('en.airport', 'airport', 'aéroport', { pos: 'noun' }),
        s('en.s-one-ticket', 'One ticket to London, please.', 'Un billet pour Londres, s’il vous plaît.'),
        s('en.s-what-time-train', 'What time is the next train?', 'À quelle heure est le prochain train ?'),
        s('en.s-does-stop', 'Does this bus stop at the museum?', 'Est-ce que ce bus s’arrête au musée ?'),
      ]),
    ]),

    unit('en.u5', 'Le quotidien', 'Chiffres, temps, habitudes', '🕐', [
      lesson('en.u5.l1', 'Compter', 'Les nombres qui servent tous les jours', 'A1', [
        w('en.one', 'one', 'un', { pos: 'number' }),
        w('en.two', 'two', 'deux', { pos: 'number' }),
        w('en.three', 'three', 'trois', { pos: 'number' }),
        w('en.four', 'four', 'quatre', { pos: 'number' }),
        w('en.five', 'five', 'cinq', { pos: 'number' }),
        w('en.ten', 'ten', 'dix', { pos: 'number' }),
        w('en.twenty', 'twenty', 'vingt', { pos: 'number' }),
        w('en.hundred', 'hundred', 'cent', { pos: 'number' }),
        s('en.s-how-much', 'How much does it cost?', 'Combien ça coûte ?'),
      ]),
      lesson('en.u5.l2', 'Le temps qui passe', 'Situer dans la journée et la semaine', 'A1', [
        w('en.today', 'today', 'aujourd’hui', { pos: 'adv' }),
        w('en.tomorrow', 'tomorrow', 'demain', { pos: 'adv' }),
        w('en.yesterday', 'yesterday', 'hier', { pos: 'adv' }),
        w('en.now', 'now', 'maintenant', { pos: 'adv' }),
        w('en.morning', 'morning', 'matin', { pos: 'noun' }),
        w('en.evening', 'evening', 'soir', { pos: 'noun' }),
        w('en.week', 'week', 'semaine', { pos: 'noun' }),
        s('en.s-what-time', 'What time is it?', 'Quelle heure est-il ?'),
        s('en.s-see-tomorrow', 'See you tomorrow morning.', 'À demain matin.'),
        s('en.s-free-tomorrow', 'Are you free tomorrow evening?', 'Es-tu libre demain soir ?'),
      ]),
    ]),

    unit('en.u6', 'Tenir une conversation', 'Comprendre, relancer, s’en sortir', '💬', [
      lesson('en.u6.l1', 'Quand on ne comprend pas', 'Les phrases qui débloquent tout', 'A1', [
        p('en.i-dont-understand', "I don't understand", 'je ne comprends pas', { pos: 'phrase' }),
        p('en.say-again', 'could you say that again?', 'pourriez-vous répéter ?', { pos: 'phrase' }),
        p('en.what-does-mean', 'what does that mean?', 'qu’est-ce que ça veut dire ?', { pos: 'phrase' }),
        p('en.how-do-you-say', 'how do you say… in English?', 'comment dit-on… en anglais ?', { pos: 'phrase' }),
        p('en.i-dont-know', "I don't know", 'je ne sais pas', { pos: 'phrase' }),
        s('en.s-little-english', 'I only speak a little English.', 'Je ne parle qu’un peu anglais.'),
        s('en.s-write-down', 'Could you write it down?', 'Pourriez-vous l’écrire ?'),
        s('en.s-spell', 'How do you spell that?', 'Comment ça s’écrit ?'),
        s('en.s-repeat-slowly', 'Please repeat that slowly.', 'Répétez cela lentement, s’il vous plaît.'),
      ]),
      lesson('en.u6.l2', 'Donner son avis', 'Réagir à ce qu’on vous dit', 'A2', [
        w('en.good', 'good', 'bon', { pos: 'adj' }),
        w('en.bad', 'bad', 'mauvais', { pos: 'adj' }),
        w('en.beautiful', 'beautiful', 'beau', { pos: 'adj' }),
        w('en.difficult', 'difficult', 'difficile', { pos: 'adj' }),
        w('en.easy', 'easy', 'facile', { pos: 'adj' }),
        p('en.i-think', 'I think that…', 'je pense que…', { pos: 'phrase' }),
        p('en.i-agree', 'I agree', 'je suis d’accord', { pos: 'phrase' }),
        s('en.s-i-like-it', 'I really like it.', 'J’aime vraiment ça.'),
        s('en.s-not-sure', "I'm not sure about that.", 'Je n’en suis pas certain.'),
      ]),
    ]),
  ],
});
