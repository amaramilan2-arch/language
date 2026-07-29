/**
 * Dialogues d'espagnol (castillan).
 *
 * Registre du tutoiement, très majoritaire en Espagne y compris entre inconnus
 * de la même génération — vouvoyer un serveur de bar y sonne étrangement guindé.
 */

import { dialogue, line, question } from '../schema.js';
import type { Dialogue } from '@polyglotte/core';

export const ES_DIALOGUES: Record<string, Dialogue[]> = {
  'es.u1': [
    dialogue(
      'es.d.presentacion',
      'Faire connaissance',
      'Vous rencontrez quelqu’un dans une auberge de jeunesse.',
      'A1',
      [
        line('a', '¡Hola! ¿Cómo te llamas?', 'Salut ! Comment t’appelles-tu ?'),
        line('b', 'Me llamo Marc. ¿Y tú?', 'Je m’appelle Marc. Et toi ?'),
        line('a', 'Lucía. ¿De dónde eres?', 'Lucía. D’où viens-tu ?'),
        line('b', 'Soy francés, de París. Estoy aprendiendo español.', 'Je suis français, de Paris. J’apprends l’espagnol.'),
        line('a', '¡Qué bien! Hablas muy bien ya.', 'C’est bien ! Tu parles déjà très bien.'),
        line('b', 'Gracias, pero necesito practicar más.', 'Merci, mais j’ai besoin de pratiquer davantage.'),
      ],
      [
        question('es.d.presentacion.q1', 'Comment s’appelle la femme ?', ['Lucía', 'Marta', 'Laura'], 0),
        question('es.d.presentacion.q2', 'D’où vient Marc ?', ['De Paris', 'De Madrid', 'De Lyon'], 0),
        question('es.d.presentacion.q3', 'Que répond Marc au compliment ?', [
          'Qu’il doit encore pratiquer',
          'Qu’il parle déjà couramment',
          'Qu’il apprend depuis dix ans',
        ], 0),
      ],
    ),
  ],

  'es.u3': [
    dialogue(
      'es.d.bar',
      'Commander au bar',
      'Un bar de quartier, en fin d’après-midi.',
      'A1',
      [
        line('a', 'Buenas, ¿qué te pongo?', 'Bonjour, qu’est-ce que je te sers ?'),
        line('b', 'Una caña y una tapa de tortilla, por favor.', 'Une bière pression et une part de tortilla, s’il te plaît.'),
        line('a', 'Marchando. ¿Algo más?', 'Ça arrive. Autre chose ?'),
        line('b', 'No, nada más. ¿Cuánto es?', 'Non, rien d’autre. Ça fait combien ?'),
        line('a', 'Son cuatro euros con veinte.', 'Ça fait quatre euros vingt.'),
        line('b', 'Aquí tienes. Gracias.', 'Voilà. Merci.'),
      ],
      [
        question('es.d.bar.q1', 'Que commande le client ?', [
          'Une bière et une tortilla',
          'Un café et un sandwich',
          'Un vin et des olives',
        ], 0),
        question('es.d.bar.q2', 'Combien cela coûte-t-il ?', ['4,20 €', '4,12 €', '14,20 €'], 0),
        question('es.d.bar.q3', 'Que veut dire « ¿Algo más? » ?', [
          'Autre chose ?',
          'C’est tout ?',
          'Vous payez comment ?',
        ], 0),
      ],
    ),
  ],

  'es.u4': [
    dialogue(
      'es.d.direcciones',
      'Demander son chemin',
      'Vous cherchez la gare dans une ville espagnole.',
      'A1',
      [
        line('a', 'Perdona, ¿dónde está la estación?', 'Excuse-moi, où est la gare ?'),
        line('b', 'Está bastante cerca. ¿Vas andando?', 'Elle est assez près. Tu y vas à pied ?'),
        line('a', 'Sí. ¿Está lejos?', 'Oui. C’est loin ?'),
        line('b', 'Cinco minutos. Todo recto y luego a la derecha.', 'Cinq minutes. Tout droit puis à droite.'),
        line('a', 'Todo recto y a la derecha. Muchas gracias.', 'Tout droit et à droite. Merci beaucoup.'),
        line('b', 'De nada. Que vaya bien.', 'De rien. Bonne continuation.'),
      ],
      [
        question('es.d.direcciones.q1', 'Combien de temps de marche ?', ['Cinq minutes', 'Quinze minutes', 'Cinquante minutes'], 0),
        question('es.d.direcciones.q2', 'Quel est le trajet ?', [
          'Tout droit puis à droite',
          'Tout droit puis à gauche',
          'À gauche puis tout droit',
        ], 0),
        question('es.d.direcciones.q3', 'Comment se termine l’échange ?', [
          'Par un souhait de bonne continuation',
          'Par une invitation à prendre un café',
          'Par un numéro de téléphone',
        ], 0),
      ],
    ),
  ],

  'es.u6': [
    dialogue(
      'es.d.no-entiendo',
      'Quand on ne comprend pas',
      'Au téléphone, la personne parle vite.',
      'A2',
      [
        line('a', 'Entonces quedamos el jueves a las siete, ¿vale?', 'On se retrouve donc jeudi à sept heures, d’accord ?'),
        line('b', 'Perdona, no te he entendido bien. ¿Puedes repetir más despacio?', 'Pardon, je n’ai pas bien compris. Peux-tu répéter plus lentement ?'),
        line('a', 'Claro. El jueves. A las siete de la tarde.', 'Bien sûr. Jeudi. À sept heures du soir.'),
        line('b', 'Vale, el jueves a las siete. ¿Dónde?', 'D’accord, jeudi à sept heures. Où ?'),
        line('a', 'En el bar de siempre, al lado de la plaza.', 'Au bar habituel, à côté de la place.'),
        line('b', 'Perfecto. Hasta el jueves.', 'Parfait. À jeudi.'),
      ],
      [
        question('es.d.no-entiendo.q1', 'Quel jour et à quelle heure ?', [
          'Jeudi à 19 h',
          'Mardi à 19 h',
          'Jeudi à 7 h du matin',
        ], 0),
        question('es.d.no-entiendo.q2', 'Que demande-t-il ?', [
          'De répéter plus lentement',
          'De parler plus fort',
          'De rappeler plus tard',
        ], 0),
        question('es.d.no-entiendo.q3', 'Où se retrouvent-ils ?', [
          'Au bar habituel, près de la place',
          'Chez lui',
          'À la gare',
        ], 0),
      ],
    ),
  ],
};
