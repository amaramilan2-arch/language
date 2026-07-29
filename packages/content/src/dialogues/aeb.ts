/**
 * Dialogues d'arabe tunisien.
 *
 * Sans synthèse vocale, ces dialogues se travaillent à la lecture plutôt qu'à
 * l'écoute — c'est une limite assumée, levée le jour où des enregistrements
 * existeront. La translittération porte alors tout le poids : elle est ici
 * systématique, réplique par réplique.
 *
 * L'échange est écrit tel qu'il se déroulerait vraiment. Un Tunisien ne dit pas
 * « من أين أنت » mais « منين إنتي », ne compte pas en « اثنين » mais en « زوز »,
 * et glisse du français dans la conversation sans y penser — ce qui est reflété
 * ici plutôt que corrigé.
 */

import { dialogue, line, question } from '../schema.js';
import type { Dialogue } from '@polyglotte/core';

export const AEB_DIALOGUES: Record<string, Dialogue[]> = {
  'aeb.u1': [
    dialogue(
      'aeb.d.te3aref',
      'Faire connaissance',
      'Vous rencontrez quelqu’un chez des amis, à Tunis.',
      'A1',
      [
        line('a', 'عسلامة! شنوّة إسمك؟', 'Salut ! Comment t’appelles-tu ?', '3aslèma ! chnowa esmek ?'),
        line('b', 'إسمي مارك. وإنتي؟', 'Je m’appelle Marc. Et toi ?', 'esmi Marc. w enti ?'),
        line('a', 'آنا سلمى. منين إنتي؟', 'Moi c’est Salma. D’où viens-tu ?', 'èna Salma. mnin enti ?'),
        line('b', 'آنا من فرنسا، من باريس.', 'Je viens de France, de Paris.', 'èna men fransa, men Paris.'),
        line('a', 'تحكي بالعربي؟', 'Tu parles arabe ?', 't7ki bel-3arbi ?'),
        line('b', 'نحكي شويّة برك. أحكي بالشويّة من فضلك.', 'Je parle juste un peu. Parle doucement, s’il te plaît.', 'na7ki chwaya barka. a7ki bech-chwaya min fadhlek.'),
      ],
      [
        question('aeb.d.te3aref.q1', 'Comment s’appelle la femme ?', ['Salma', 'Sarra', 'Samia'], 0),
        question('aeb.d.te3aref.q2', 'Que demande Marc à la fin ?', [
          'Qu’elle parle doucement',
          'Qu’elle parle plus fort',
          'Qu’elle répète son nom',
        ], 0),
        question('aeb.d.te3aref.q3', 'Que signifie « منين إنتي ؟ » (mnin enti ?)', [
          'D’où viens-tu ?',
          'Comment vas-tu ?',
          'Quel âge as-tu ?',
        ], 0),
      ],
    ),
  ],

  'aeb.u3': [
    dialogue(
      'aeb.d.9ahwa',
      'Commander au café',
      'Un café de quartier — on y passe des heures pour trois dinars.',
      'A1',
      [
        line('a', 'أهلا، شنوّة تحبّ؟', 'Bonjour, que voulez-vous ?', 'ahla, chnowa t7eb ?'),
        line('b', 'نحبّ قهوة، من فضلك.', 'Je voudrais un café, s’il vous plaît.', 'n7eb 9ahwa, min fadhlek.'),
        line('a', 'قهوة عربي ولّا إكسبرسّو؟', 'Café à la turque ou expresso ?', '9ahwa 3arbi walla express ?'),
        line('b', 'إكسبرسّو. وعندك ماء بارد؟', 'Expresso. Et vous avez de l’eau fraîche ?', 'express. w 3andek mè bèred ?'),
        line('a', 'إيه، تو نجيبهالك.', 'Oui, je vous l’apporte tout de suite.', 'èy, tawwa njibhalek.'),
        line('b', 'يعيشك. قدّاش الحساب؟', 'Merci. Combien fait l’addition ?', 'ya3ayshek. 9addèch el-7sèb ?'),
      ],
      [
        question('aeb.d.9ahwa.q1', 'Que choisit le client ?', ['Un expresso', 'Un café à la turque', 'Un thé'], 0),
        question('aeb.d.9ahwa.q2', 'Que demande-t-il en plus ?', [
          'De l’eau fraîche',
          'Du sucre',
          'Un croissant',
        ], 0),
        question('aeb.d.9ahwa.q3', 'Que veut dire « يعيشك » (ya3ayshek) ?', [
          'Merci',
          'S’il vous plaît',
          'Au revoir',
        ], 0),
      ],
    ),
  ],

  'aeb.u4': [
    dialogue(
      'aeb.d.taxi',
      'Prendre un taxi',
      'Vous montez dans un taxi à Tunis. Négocier le prix est normal.',
      'A1',
      [
        line('a', 'وين تحبّ تمشي؟', 'Où voulez-vous aller ?', 'win t7eb temchi ?'),
        line('b', 'نحبّ نمشي للمدينة. قدّاش؟', 'Je veux aller à la médina. Combien ?', 'n7eb nemchi lil-medina. 9addèch ?'),
        line('a', 'عشرة دينار.', 'Dix dinars.', '3achra dinar.'),
        line('b', 'برشا! مش بعيد ياسر.', 'C’est beaucoup ! Ce n’est pas très loin.', 'barcha ! mech b3id yèsser.'),
        line('a', 'باهي، سبعة. يزّي.', 'D’accord, sept. Ça suffit.', 'bèhi, sab3a. yezzi.'),
        line('b', 'باهي. وقّفلي قدّام الباب من فضلك.', 'D’accord. Arrêtez-moi devant la porte, s’il vous plaît.', 'bèhi. wa99efli 9oddèm el-bèb min fadhlek.'),
      ],
      [
        question('aeb.d.taxi.q1', 'Où va le client ?', ['À la médina', 'À l’aéroport', 'À la gare'], 0),
        question('aeb.d.taxi.q2', 'Quel prix est finalement convenu ?', [
          'Sept dinars',
          'Dix dinars',
          'Cinq dinars',
        ], 0),
        question('aeb.d.taxi.q3', 'Que veut dire « برشا » (barcha) ici ?', [
          'C’est beaucoup (trop cher)',
          'C’est parfait',
          'C’est loin',
        ], 0),
      ],
    ),
  ],

  'aeb.u6': [
    dialogue(
      'aeb.d.mafhemtech',
      'Quand on ne comprend pas',
      'Votre interlocuteur parle vite — le cas le plus fréquent en derja.',
      'A2',
      [
        line('a', 'غدوة نمشيو للسوق مع خويا، تحبّ تجي؟', 'Demain on va au marché avec mon frère, tu veux venir ?', 'ghodwa nemchiw lis-souq m3a khouya, t7eb tji ?'),
        line('b', 'سامحني، ما فهمتش. عاود بالشويّة.', 'Excuse-moi, je n’ai pas compris. Répète doucement.', 'sèm7ni, ma fhemtech. 3awed bech-chwaya.'),
        line('a', 'غدوة… السوق… تجي معانا؟', 'Demain… le marché… tu viens avec nous ?', 'ghodwa… es-souq… tji m3ana ?'),
        line('b', 'آه، فهمت. وقتاش؟', 'Ah, j’ai compris. Quand ?', 'èh, fhemt. waqtèch ?'),
        line('a', 'الصباح، على التسعة.', 'Le matin, vers neuf heures.', 'es-sbè7, 3la et-tes3a.'),
        line('b', 'باهي، نجي. يعيشك.', 'D’accord, je viens. Merci.', 'bèhi, nji. ya3ayshek.'),
      ],
      [
        question('aeb.d.mafhemtech.q1', 'Où vont-ils ?', ['Au marché', 'Au café', 'À la plage'], 0),
        question('aeb.d.mafhemtech.q2', 'Quand ?', [
          'Demain matin vers 9 h',
          'Ce soir vers 9 h',
          'Demain après-midi',
        ], 0),
        question('aeb.d.mafhemtech.q3', 'Comment se dit « je n’ai pas compris » ?', [
          'ما فهمتش (ma fhemtech)',
          'ما نعرفش (ma na3refch)',
          'ما نجّمش (ma nnajjemch)',
        ], 0),
      ],
    ),
  ],
};
