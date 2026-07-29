/**
 * Dialogues d'italien.
 *
 * Le registre bascule volontairement d'un dialogue à l'autre : « Lei » avec un
 * commerçant, « tu » entre jeunes. C'est le piège classique du francophone, qui
 * transpose le vouvoiement français sans voir que l'italien change carrément de
 * personne grammaticale.
 */

import { dialogue, line, question } from '../schema.js';
import type { Dialogue } from '@polyglotte/core';

export const IT_DIALOGUES: Record<string, Dialogue[]> = {
  'it.u1': [
    dialogue(
      'it.d.conoscenza',
      'Faire connaissance',
      'Vous discutez avec quelqu’un dans le train.',
      'A1',
      [
        line('a', 'Ciao, come ti chiami?', 'Salut, comment t’appelles-tu ?'),
        line('b', 'Mi chiamo Marc. Piacere.', 'Je m’appelle Marc. Enchanté.'),
        line('a', 'Piacere mio. Di dove sei?', 'Enchantée. D’où viens-tu ?'),
        line('b', 'Sono francese. Abito a Parigi.', 'Je suis français. J’habite à Paris.'),
        line('a', 'E parli italiano molto bene!', 'Et tu parles très bien italien !'),
        line('b', 'Grazie, ma sto ancora imparando.', 'Merci, mais je suis encore en train d’apprendre.'),
      ],
      [
        question('it.d.conoscenza.q1', 'Où habite Marc ?', ['À Paris', 'À Rome', 'À Milan'], 0),
        question('it.d.conoscenza.q2', 'Que répond-il au compliment ?', [
          'Qu’il apprend encore',
          'Qu’il est bilingue',
          'Qu’il a vécu en Italie',
        ], 0),
        question('it.d.conoscenza.q3', 'Quel registre emploient-ils ?', [
          'Le tutoiement',
          'Le vouvoiement',
          'Ils alternent les deux',
        ], 0),
      ],
    ),
  ],

  'it.u3': [
    dialogue(
      'it.d.bar',
      'Commander au bar',
      'Un bar italien le matin — on consomme debout, au comptoir.',
      'A1',
      [
        line('a', 'Buongiorno, mi dica.', 'Bonjour, je vous écoute.'),
        line('b', 'Un caffè e un cornetto, per favore.', 'Un expresso et un croissant, s’il vous plaît.'),
        line('a', 'Subito. Al banco o al tavolo?', 'Tout de suite. Au comptoir ou à table ?'),
        line('b', 'Al banco, grazie. Quanto viene?', 'Au comptoir, merci. Combien ça fait ?'),
        line('a', 'Due euro e cinquanta.', 'Deux euros cinquante.'),
        line('b', 'Ecco a lei. Grazie mille.', 'Voilà. Merci beaucoup.'),
      ],
      [
        question('it.d.bar.q1', 'Que commande le client ?', [
          'Un expresso et un croissant',
          'Un cappuccino et une brioche',
          'Un thé et un sandwich',
        ], 0),
        question('it.d.bar.q2', 'Où consomme-t-il ?', ['Au comptoir', 'À table', 'À emporter'], 0),
        question('it.d.bar.q3', 'Quel registre emploie le serveur ?', [
          'Le vouvoiement (« mi dica »)',
          'Le tutoiement',
          'Un registre familier',
        ], 0),
      ],
    ),
  ],

  'it.u4': [
    dialogue(
      'it.d.indicazioni',
      'Demander son chemin',
      'Vous cherchez la gare dans une ville italienne.',
      'A1',
      [
        line('a', 'Scusi, dov’è la stazione?', 'Excusez-moi, où est la gare ?'),
        line('b', 'Sempre dritto, poi la seconda a sinistra.', 'Tout droit, puis la deuxième à gauche.'),
        line('a', 'È lontano da qui?', 'Est-ce loin d’ici ?'),
        line('b', 'No, dieci minuti a piedi. Ma può prendere l’autobus.', 'Non, dix minutes à pied. Mais vous pouvez prendre le bus.'),
        line('a', 'Preferisco camminare. Grazie mille.', 'Je préfère marcher. Merci beaucoup.'),
        line('b', 'Prego, buona giornata.', 'Je vous en prie, bonne journée.'),
      ],
      [
        question('it.d.indicazioni.q1', 'Quel est le trajet ?', [
          'Tout droit, deuxième à gauche',
          'Tout droit, première à droite',
          'À gauche puis tout droit',
        ], 0),
        question('it.d.indicazioni.q2', 'Que décide le voyageur ?', [
          'De marcher',
          'De prendre le bus',
          'De prendre un taxi',
        ], 0),
        question('it.d.indicazioni.q3', 'Combien de temps à pied ?', ['Dix minutes', 'Deux minutes', 'Trente minutes'], 0),
      ],
    ),
  ],

  'it.u6': [
    dialogue(
      'it.d.non-capisco',
      'Quand on ne comprend pas',
      'Un rendez-vous se déplace, et vous perdez le fil.',
      'A2',
      [
        line('a', 'Allora ci vediamo domani mattina invece di stasera.', 'Alors on se voit demain matin au lieu de ce soir.'),
        line('b', 'Scusa, non ho capito. Puoi ripetere più lentamente?', 'Pardon, je n’ai pas compris. Peux-tu répéter plus lentement ?'),
        line('a', 'Certo. Non stasera. Domani mattina.', 'Bien sûr. Pas ce soir. Demain matin.'),
        line('b', 'Ah, domani mattina. A che ora?', 'Ah, demain matin. À quelle heure ?'),
        line('a', 'Alle nove, davanti al bar.', 'À neuf heures, devant le bar.'),
        line('b', 'Perfetto, a domani.', 'Parfait, à demain.'),
      ],
      [
        question('it.d.non-capisco.q1', 'Quand se voient-ils finalement ?', [
          'Demain matin',
          'Ce soir',
          'Demain soir',
        ], 0),
        question('it.d.non-capisco.q2', 'À quelle heure et où ?', [
          'À 9 h devant le bar',
          'À 9 h à la gare',
          'À 19 h devant le bar',
        ], 0),
        question('it.d.non-capisco.q3', 'Que demande-t-il ?', [
          'De répéter plus lentement',
          'De parler plus fort',
          'D’écrire le rendez-vous',
        ], 0),
      ],
    ),
  ],
};
