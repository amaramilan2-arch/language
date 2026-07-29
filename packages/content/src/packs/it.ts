/**
 * Pack d'italien — niveau A1 vers A2.
 *
 * L'italien est la langue la plus proche du français des quatre : la tentation
 * est de le survoler. Le pack insiste donc sur les endroits où cette proximité
 * trompe — les faux amis, et surtout les doubles consonnes, qui changent le sens
 * (« nono » le neuvième, « nonno » le grand-père) et que l'oreille française
 * n'entend pas spontanément.
 */

import { lesson, p, pack, s, unit, w } from '../schema.js';
import type { ContentPack } from '@polyglotte/core';
import { IT_DIALOGUES } from '../dialogues/it.js';

export const IT: ContentPack = pack({
  language: 'it',
  version: 1,
  profile: {
    code: 'it',
    name: 'Italien',
    flag: '🇮🇹',
    direction: 'ltr',
    bcp47: 'it-IT',
    hasNativeTts: true,
    hasNativeAsr: true,
    needsTransliteration: false,
  },
  units: [
    unit('it.u1', 'Premiers contacts', 'Saluer, se présenter, rester poli', '👋', [
      lesson('it.u1.l1', 'Saluer', 'Aborder quelqu’un et prendre congé', 'A1', [
        p('it.ciao', 'ciao', 'salut', { pos: 'phrase', note: 'Sert à dire bonjour et au revoir, mais uniquement entre proches.' }),
        p('it.buongiorno', 'buongiorno', 'bonjour', { pos: 'phrase', note: 'La forme polie, celle à utiliser avec un inconnu ou un commerçant.' }),
        p('it.buonasera', 'buonasera', 'bonsoir', { pos: 'phrase' }),
        p('it.arrivederci', 'arrivederci', 'au revoir', { pos: 'phrase' }),
        p('it.a-domani', 'a domani', 'à demain', { pos: 'phrase' }),
        p('it.come-stai', 'come stai?', 'comment vas-tu ?', { pos: 'phrase' }),
        p('it.sto-bene', 'sto bene, grazie', 'je vais bien, merci', { pos: 'phrase' }),
        p('it.piacere', 'piacere', 'enchanté', { pos: 'phrase' }),
        s('it.s-e-un-piacere', 'È un piacere conoscerti.', 'C’est un plaisir de te connaître.'),
      ]),
      lesson('it.u1.l2', 'Politesse', 'Demander et remercier', 'A1', [
        p('it.per-favore', 'per favore', 's’il te plaît', { alt: ['s’il vous plaît'], pos: 'phrase' }),
        w('it.grazie', 'grazie', 'merci', { pos: 'phrase' }),
        p('it.prego', 'prego', 'de rien', { pos: 'phrase', note: 'Mot à tout faire : « de rien », « je vous en prie », « après vous ».' }),
        p('it.scusi', 'scusi', 'excusez-moi', { pos: 'phrase' }),
        p('it.mi-dispiace', 'mi dispiace', 'je suis désolé', { pos: 'phrase' }),
        w('it.si', 'sì', 'oui', { pos: 'adv' }),
        w('it.no', 'no', 'non', { pos: 'adv' }),
        s('it.s-puo-aiutarmi', 'Può aiutarmi, per favore?', 'Pouvez-vous m’aider, s’il vous plaît ?'),
        s('it.s-non-fa-niente', 'Non fa niente.', 'Ce n’est rien.'),
      ]),
      lesson('it.u1.l3', 'Se présenter', 'Dire qui l’on est', 'A1', [
        p('it.mi-chiamo', 'mi chiamo…', 'je m’appelle…', { pos: 'phrase' }),
        p('it.come-ti-chiami', 'come ti chiami?', 'comment t’appelles-tu ?', { pos: 'phrase' }),
        p('it.sono-francese', 'sono francese', 'je suis français', { pos: 'phrase' }),
        p('it.di-dove-sei', 'di dove sei?', 'd’où viens-tu ?', { pos: 'phrase' }),
        s('it.s-abito', 'Abito a Parigi.', 'J’habite à Paris.'),
        s('it.s-quanti-anni', 'Quanti anni hai?', 'Quel âge as-tu ?'),
        s('it.s-lavoro', 'Lavoro in un ufficio.', 'Je travaille dans un bureau.'),
        s('it.s-imparo', 'Sto imparando l’italiano.', 'J’apprends l’italien.'),
        s('it.s-piu-lentamente', 'Puoi parlare più lentamente?', 'Peux-tu parler plus lentement ?'),
      ]),
    ], IT_DIALOGUES['it.u1']),

    unit('it.u2', 'Les gens', 'Parler de sa famille et des autres', '👨‍👩‍👧', [
      lesson('it.u2.l1', 'La famille', 'Nommer ses proches', 'A1', [
        w('it.famiglia', 'la famiglia', 'famille', { pos: 'noun', gender: 'f' }),
        w('it.madre', 'la madre', 'mère', { pos: 'noun', gender: 'f' }),
        w('it.padre', 'il padre', 'père', { pos: 'noun', gender: 'm' }),
        w('it.fratello', 'il fratello', 'frère', { pos: 'noun', gender: 'm' }),
        w('it.sorella', 'la sorella', 'sœur', { pos: 'noun', gender: 'f' }),
        w('it.figlio', 'il figlio', 'fils', { pos: 'noun', gender: 'm' }),
        w('it.figlia', 'la figlia', 'fille (enfant)', { pos: 'noun', gender: 'f' }),
        w('it.marito', 'il marito', 'mari', { pos: 'noun', gender: 'm' }),
        w('it.moglie', 'la moglie', 'épouse', { pos: 'noun', gender: 'f' }),
      ]),
      lesson('it.u2.l2', 'Décrire quelqu’un', 'Dire comment sont les gens', 'A1', [
        w('it.amico', 'l’amico', 'ami', { pos: 'noun', gender: 'm' }),
        w('it.uomo', 'l’uomo', 'homme', { pos: 'noun', gender: 'm' }),
        w('it.donna', 'la donna', 'femme', { pos: 'noun', gender: 'f' }),
        w('it.bambino', 'il bambino', 'enfant', { pos: 'noun', gender: 'm' }),
        w('it.giovane', 'giovane', 'jeune', { pos: 'adj' }),
        w('it.vecchio', 'vecchio', 'vieux', { pos: 'adj' }),
        w('it.simpatico', 'simpatico', 'sympathique', { pos: 'adj' }),
        s('it.s-mia-sorella', 'Mia sorella è insegnante.', 'Ma sœur est enseignante.'),
        s('it.s-molto-gentile', 'È una persona molto gentile.', 'C’est une personne très gentille.'),
      ]),
    ]),

    unit('it.u3', 'Manger et boire', 'Commander et se débrouiller à table', '🍽️', [
      lesson('it.u3.l1', 'Au bar', 'Commander une boisson', 'A1', [
        w('it.acqua', 'l’acqua', 'eau', { pos: 'noun', gender: 'f' }),
        w('it.caffe', 'il caffè', 'café', { pos: 'noun', gender: 'm', note: 'Commander « un caffè » donne un expresso. Pour un allongé, demander « un caffè lungo ».' }),
        w('it.vino', 'il vino', 'vin', { pos: 'noun', gender: 'm' }),
        w('it.birra', 'la birra', 'bière', { pos: 'noun', gender: 'f' }),
        w('it.pane', 'il pane', 'pain', { pos: 'noun', gender: 'm' }),
        p('it.vorrei', 'vorrei…', 'je voudrais…', { pos: 'phrase' }),
        s('it.s-un-caffe', 'Vorrei un caffè, per favore.', 'Je voudrais un café, s’il vous plaît.'),
        s('it.s-il-conto', 'Il conto, per favore.', 'L’addition, s’il vous plaît.'),
        s('it.s-acqua-naturale', 'Un’acqua naturale, per favore.', 'Une eau plate, s’il vous plaît.'),
      ]),
      lesson('it.u3.l2', 'Au restaurant', 'Choisir et payer', 'A2', [
        w('it.colazione', 'la colazione', 'petit-déjeuner', { pos: 'noun', gender: 'f' }),
        w('it.pranzo', 'il pranzo', 'déjeuner', { pos: 'noun', gender: 'm' }),
        w('it.cena', 'la cena', 'dîner', { pos: 'noun', gender: 'f' }),
        w('it.carne', 'la carne', 'viande', { pos: 'noun', gender: 'f' }),
        w('it.pesce', 'il pesce', 'poisson', { pos: 'noun', gender: 'm' }),
        w('it.verdura', 'la verdura', 'légumes', { pos: 'noun', gender: 'f' }),
        w('it.buono', 'buono', 'bon', { pos: 'adj' }),
        s('it.s-tavolo-due', 'Un tavolo per due, per favore.', 'Une table pour deux, s’il vous plaît.'),
        s('it.s-vegetariano', 'Sono vegetariano.', 'Je suis végétarien.'),
      ]),
    ], IT_DIALOGUES['it.u3']),

    unit('it.u4', 'Se déplacer', 'Trouver son chemin et prendre les transports', '🚉', [
      lesson('it.u4.l1', 'Demander son chemin', 'Ne jamais rester perdu', 'A1', [
        p('it.dov-e', 'dov’è…?', 'où est… ?', { pos: 'phrase' }),
        w('it.sinistra', 'la sinistra', 'gauche', { pos: 'noun', gender: 'f' }),
        w('it.destra', 'la destra', 'droite', { pos: 'noun', gender: 'f' }),
        p('it.sempre-dritto', 'sempre dritto', 'tout droit', { pos: 'adv' }),
        w('it.vicino', 'vicino', 'près', { pos: 'adv' }),
        w('it.lontano', 'lontano', 'loin', { pos: 'adv' }),
        s('it.s-dov-e-stazione', 'Dov’è la stazione?', 'Où est la gare ?'),
        s('it.s-mi-sono-perso', 'Mi sono perso.', 'Je me suis perdu.'),
        s('it.s-e-lontano', 'È lontano da qui?', 'Est-ce loin d’ici ?'),
      ]),
      lesson('it.u4.l2', 'Les transports', 'Acheter un billet, monter à bord', 'A1', [
        w('it.treno', 'il treno', 'train', { pos: 'noun', gender: 'm' }),
        w('it.autobus', 'l’autobus', 'bus', { pos: 'noun', gender: 'm' }),
        w('it.aereo', 'l’aereo', 'avion', { pos: 'noun', gender: 'm' }),
        w('it.biglietto', 'il biglietto', 'billet', { pos: 'noun', gender: 'm' }),
        w('it.stazione', 'la stazione', 'gare', { pos: 'noun', gender: 'f' }),
        w('it.strada', 'la strada', 'rue', { pos: 'noun', gender: 'f' }),
        s('it.s-un-biglietto', 'Un biglietto per Roma, per favore.', 'Un billet pour Rome, s’il vous plaît.'),
        s('it.s-a-che-ora', 'A che ora parte il prossimo treno?', 'À quelle heure part le prochain train ?'),
        s('it.s-si-ferma', 'Questo autobus si ferma al museo?', 'Est-ce que ce bus s’arrête au musée ?'),
      ]),
    ], IT_DIALOGUES['it.u4']),

    unit('it.u5', 'Le quotidien', 'Chiffres, temps, habitudes', '🕐', [
      lesson('it.u5.l1', 'Compter', 'Les nombres qui servent tous les jours', 'A1', [
        w('it.uno', 'uno', 'un', { pos: 'number' }),
        w('it.due', 'due', 'deux', { pos: 'number' }),
        w('it.tre', 'tre', 'trois', { pos: 'number' }),
        w('it.quattro', 'quattro', 'quatre', { pos: 'number' }),
        w('it.cinque', 'cinque', 'cinq', { pos: 'number' }),
        w('it.dieci', 'dieci', 'dix', { pos: 'number' }),
        w('it.venti', 'venti', 'vingt', { pos: 'number' }),
        w('it.cento', 'cento', 'cent', { pos: 'number' }),
        s('it.s-quanto-costa', 'Quanto costa?', 'Combien ça coûte ?'),
      ]),
      lesson('it.u5.l2', 'Le temps qui passe', 'Situer dans la journée et la semaine', 'A1', [
        w('it.oggi', 'oggi', 'aujourd’hui', { pos: 'adv' }),
        w('it.domani', 'domani', 'demain', { pos: 'adv' }),
        w('it.ieri', 'ieri', 'hier', { pos: 'adv' }),
        w('it.adesso', 'adesso', 'maintenant', { pos: 'adv' }),
        w('it.mattina', 'la mattina', 'matin', { pos: 'noun', gender: 'f' }),
        w('it.sera', 'la sera', 'soir', { pos: 'noun', gender: 'f' }),
        w('it.settimana', 'la settimana', 'semaine', { pos: 'noun', gender: 'f' }),
        s('it.s-che-ora', 'Che ora è?', 'Quelle heure est-il ?'),
        s('it.s-a-domani-mattina', 'A domani mattina.', 'À demain matin.'),
      ]),
    ]),

    unit('it.u6', 'Tenir une conversation', 'Comprendre, relancer, s’en sortir', '💬', [
      lesson('it.u6.l1', 'Quand on ne comprend pas', 'Les phrases qui débloquent tout', 'A1', [
        p('it.non-capisco', 'non capisco', 'je ne comprends pas', { pos: 'phrase' }),
        p('it.puo-ripetere', 'può ripetere?', 'pouvez-vous répéter ?', { pos: 'phrase' }),
        p('it.che-significa', 'che significa…?', 'que signifie… ?', { pos: 'phrase' }),
        p('it.come-si-dice', 'come si dice… in italiano?', 'comment dit-on… en italien ?', { pos: 'phrase' }),
        p('it.non-lo-so', 'non lo so', 'je ne sais pas', { pos: 'phrase' }),
        s('it.s-poco-italiano', 'Parlo solo un po’ d’italiano.', 'Je ne parle qu’un peu italien.'),
        s('it.s-scrivere', 'Può scriverlo?', 'Pouvez-vous l’écrire ?'),
        s('it.s-come-si-scrive', 'Come si scrive?', 'Comment ça s’écrit ?'),
        s('it.s-ancora', 'Ancora una volta, più lentamente.', 'Encore une fois, plus lentement.'),
      ]),
      lesson('it.u6.l2', 'Donner son avis', 'Réagir à ce qu’on vous dit', 'A2', [
        w('it.bello', 'bello', 'beau', { pos: 'adj' }),
        w('it.brutto', 'brutto', 'laid', { pos: 'adj' }),
        w('it.difficile', 'difficile', 'difficile', { pos: 'adj' }),
        w('it.facile', 'facile', 'facile', { pos: 'adj' }),
        w('it.magari', 'magari', 'peut-être', { pos: 'adv', note: 'Mot très italien : selon le ton, « peut-être », « si seulement ! » ou « et comment ! ».' }),
        p('it.penso-che', 'penso che…', 'je pense que…', { pos: 'phrase' }),
        p('it.sono-daccordo', 'sono d’accordo', 'je suis d’accord', { pos: 'phrase' }),
        s('it.s-mi-piace', 'Mi piace molto.', 'J’aime beaucoup.'),
        s('it.s-non-sono-sicuro', 'Non sono sicuro.', 'Je n’en suis pas certain.'),
      ]),
    ], IT_DIALOGUES['it.u6']),
  ],
});
