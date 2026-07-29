/**
 * Dialogues d'anglais.
 *
 * Écrits pour ressembler à ce qu'on entend vraiment : contractions, réponses
 * courtes, relances. Un dialogue de manuel où chacun parle en phrases complètes
 * ne prépare à rien — dans la vraie vie, l'interlocuteur répond « Sure, and for
 * you? » et non « Yes, I would like to order a coffee as well ».
 *
 * Les questions portent sur le sens de l'échange, jamais sur un mot isolé : ce
 * qu'on cherche à muscler, c'est la capacité à suivre, pas à repérer.
 */

import { dialogue, line, question } from '../schema.js';
import type { Dialogue } from '@polyglotte/core';

export const EN_DIALOGUES: Record<string, Dialogue[]> = {
  'en.u1': [
    dialogue(
      'en.d.meeting',
      'Faire connaissance',
      'Vous rencontrez quelqu’un pour la première fois, à une soirée.',
      'A1',
      [
        line('a', 'Hi, I’m Sarah. Nice to meet you.', 'Salut, je suis Sarah. Enchantée.'),
        line('b', 'Nice to meet you too. I’m Marc.', 'Enchanté également. Je suis Marc.'),
        line('a', 'Where are you from, Marc?', 'D’où viens-tu, Marc ?'),
        line('b', 'I’m French. I live in Paris, but I work here now.', 'Je suis français. J’habite à Paris, mais je travaille ici maintenant.'),
        line('a', 'Oh, how long have you been here?', 'Oh, tu es ici depuis combien de temps ?'),
        line('b', 'Only two months. My English isn’t great yet.', 'Seulement deux mois. Mon anglais n’est pas encore terrible.'),
      ],
      [
        question('en.d.meeting.q1', 'D’où vient Marc ?', ['De France', 'D’Angleterre', 'Des États-Unis'], 0),
        question('en.d.meeting.q2', 'Depuis combien de temps est-il là ?', ['Deux mois', 'Deux ans', 'Deux semaines'], 0),
        question('en.d.meeting.q3', 'Que dit-il de son anglais ?', [
          'Qu’il n’est pas encore très bon',
          'Qu’il le parle couramment',
          'Qu’il ne le parle pas du tout',
        ], 0),
      ],
    ),
  ],

  'en.u3': [
    dialogue(
      'en.d.cafe',
      'Commander au café',
      'Vous êtes au comptoir d’un café à Londres.',
      'A1',
      [
        line('a', 'Hi there, what can I get you?', 'Bonjour, qu’est-ce que je vous sers ?'),
        line('b', 'A coffee, please. And do you have anything to eat?', 'Un café, s’il vous plaît. Et avez-vous quelque chose à manger ?'),
        line('a', 'We’ve got sandwiches and a few pastries.', 'Nous avons des sandwichs et quelques viennoiseries.'),
        line('b', 'I’ll take a sandwich then. How much is that?', 'Je prendrai un sandwich alors. Ça fait combien ?'),
        line('a', 'That’s six pounds fifty. Eat in or take away?', 'Six livres cinquante. Sur place ou à emporter ?'),
        line('b', 'Take away, thanks.', 'À emporter, merci.'),
      ],
      [
        question('en.d.cafe.q1', 'Que commande le client ?', [
          'Un café et un sandwich',
          'Un thé et une viennoiserie',
          'Seulement un café',
        ], 0),
        question('en.d.cafe.q2', 'Combien coûte la commande ?', ['6,50 £', '6,15 £', '16,50 £'], 0),
        question('en.d.cafe.q3', 'Que décide-t-il à la fin ?', [
          'De l’emporter',
          'De manger sur place',
          'De revenir plus tard',
        ], 0),
      ],
    ),
  ],

  'en.u4': [
    dialogue(
      'en.d.directions',
      'Demander son chemin',
      'Vous êtes perdu dans une ville que vous ne connaissez pas.',
      'A1',
      [
        line('a', 'Excuse me, is the train station far from here?', 'Excusez-moi, la gare est-elle loin d’ici ?'),
        line('b', 'Not too far. About ten minutes on foot.', 'Pas trop loin. Environ dix minutes à pied.'),
        line('a', 'Could you tell me the way?', 'Pourriez-vous m’indiquer le chemin ?'),
        line('b', 'Go straight on, then turn left at the traffic lights.', 'Allez tout droit, puis tournez à gauche au feu.'),
        line('a', 'Left at the lights. Thank you very much.', 'À gauche au feu. Merci beaucoup.'),
        line('b', 'You can’t miss it, it’s a big grey building.', 'Vous ne pouvez pas la rater, c’est un grand bâtiment gris.'),
      ],
      [
        question('en.d.directions.q1', 'À quelle distance est la gare ?', [
          'Dix minutes à pied',
          'Dix minutes en bus',
          'Une heure à pied',
        ], 0),
        question('en.d.directions.q2', 'Que faut-il faire au feu ?', ['Tourner à gauche', 'Tourner à droite', 'Continuer tout droit'], 0),
        question('en.d.directions.q3', 'À quoi reconnaît-on la gare ?', [
          'C’est un grand bâtiment gris',
          'Il y a une horloge devant',
          'Elle est à côté d’un parc',
        ], 0),
      ],
    ),
  ],

  'en.u6': [
    dialogue(
      'en.d.misunderstanding',
      'Quand on ne comprend pas',
      'Votre interlocuteur parle vite : voici comment s’en sortir.',
      'A2',
      [
        line('a', 'So the meeting’s been moved to Thursday afternoon, alright?', 'Donc la réunion a été déplacée à jeudi après-midi, d’accord ?'),
        line('b', 'Sorry, could you say that again? You speak quite fast.', 'Désolé, pourriez-vous répéter ? Vous parlez assez vite.'),
        line('a', 'Of course. The meeting is on Thursday now, not Tuesday.', 'Bien sûr. La réunion est jeudi maintenant, pas mardi.'),
        line('b', 'Thursday. And what time?', 'Jeudi. Et à quelle heure ?'),
        line('a', 'Two o’clock. I’ll send you an email as well.', 'Quatorze heures. Je vous enverrai un courriel également.'),
        line('b', 'That would help, thanks.', 'Cela m’aiderait, merci.'),
      ],
      [
        question('en.d.misunderstanding.q1', 'Quel jour est la réunion désormais ?', ['Jeudi', 'Mardi', 'Mercredi'], 0),
        question('en.d.misunderstanding.q2', 'Pourquoi demande-t-il de répéter ?', [
          'Son interlocuteur parle trop vite',
          'Il y a trop de bruit',
          'Il n’a pas entendu la question',
        ], 0),
        question('en.d.misunderstanding.q3', 'Que propose son interlocuteur en plus ?', [
          'D’envoyer un courriel',
          'De l’appeler jeudi',
          'De reporter encore',
        ], 0),
      ],
    ),
  ],
};
