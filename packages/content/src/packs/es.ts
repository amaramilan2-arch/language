/**
 * Pack d'espagnol — niveau A1 vers A2.
 *
 * Espagnol d'Espagne (castillan) : c'est ce que la synthèse vocale rend le mieux
 * avec la voix `es-ES`, et c'est la variante la plus proche pour un francophone.
 * Les divergences notables avec l'Amérique latine sont signalées en note plutôt
 * que passées sous silence — « coger » est parfaitement banal à Madrid et à
 * éviter à Buenos Aires.
 */

import { lesson, p, pack, s, unit, w } from '../schema.js';
import type { ContentPack } from '@polyglotte/core';

export const ES: ContentPack = pack({
  language: 'es',
  version: 1,
  profile: {
    code: 'es',
    name: 'Espagnol',
    flag: '🇪🇸',
    direction: 'ltr',
    bcp47: 'es-ES',
    hasNativeTts: true,
    hasNativeAsr: true,
    needsTransliteration: false,
  },
  units: [
    unit('es.u1', 'Premiers contacts', 'Saluer, se présenter, rester poli', '👋', [
      lesson('es.u1.l1', 'Saluer', 'Aborder quelqu’un et prendre congé', 'A1', [
        p('es.hola', 'hola', 'bonjour', { alt: ['salut'], pos: 'phrase' }),
        p('es.buenos-dias', 'buenos días', 'bonjour (le matin)', { pos: 'phrase' }),
        p('es.buenas-tardes', 'buenas tardes', 'bonjour (l’après-midi)', { pos: 'phrase', note: 'S’emploie du déjeuner jusqu’au coucher du soleil, soit très tard en été.' }),
        p('es.buenas-noches', 'buenas noches', 'bonsoir', { pos: 'phrase' }),
        p('es.adios', 'adiós', 'au revoir', { pos: 'phrase' }),
        p('es.hasta-luego', 'hasta luego', 'à plus tard', { pos: 'phrase' }),
        p('es.como-estas', '¿cómo estás?', 'comment vas-tu ?', { pos: 'phrase' }),
        p('es.muy-bien', 'muy bien, gracias', 'très bien, merci', { pos: 'phrase' }),
        p('es.mucho-gusto', 'mucho gusto', 'enchanté', { pos: 'phrase' }),
      ]),
      lesson('es.u1.l2', 'Politesse', 'Demander et remercier', 'A1', [
        p('es.por-favor', 'por favor', 's’il te plaît', { alt: ['s’il vous plaît'], pos: 'phrase' }),
        w('es.gracias', 'gracias', 'merci', { pos: 'phrase' }),
        p('es.de-nada', 'de nada', 'de rien', { pos: 'phrase' }),
        p('es.perdon', 'perdón', 'pardon', { alt: ['excusez-moi'], pos: 'phrase' }),
        p('es.lo-siento', 'lo siento', 'je suis désolé', { pos: 'phrase' }),
        w('es.si', 'sí', 'oui', { pos: 'adv' }),
        w('es.no', 'no', 'non', { pos: 'adv' }),
        s('es.s-ayudar', '¿Puede ayudarme, por favor?', 'Pouvez-vous m’aider, s’il vous plaît ?'),
        s('es.s-no-pasa', 'No pasa nada.', 'Ce n’est rien.'),
      ]),
      lesson('es.u1.l3', 'Se présenter', 'Dire qui l’on est', 'A1', [
        p('es.me-llamo', 'me llamo…', 'je m’appelle…', { pos: 'phrase' }),
        p('es.como-te-llamas', '¿cómo te llamas?', 'comment t’appelles-tu ?', { pos: 'phrase' }),
        p('es.soy-frances', 'soy francés', 'je suis français', { pos: 'phrase' }),
        p('es.de-donde-eres', '¿de dónde eres?', 'd’où viens-tu ?', { pos: 'phrase' }),
        s('es.s-vivo', 'Vivo en París.', 'J’habite à Paris.'),
        s('es.s-cuantos-anos', '¿Cuántos años tienes?', 'Quel âge as-tu ?'),
        s('es.s-trabajo', 'Trabajo en una oficina.', 'Je travaille dans un bureau.'),
        s('es.s-aprendo', 'Estoy aprendiendo español.', 'J’apprends l’espagnol.'),
        s('es.s-mas-despacio', '¿Puedes hablar más despacio?', 'Peux-tu parler plus lentement ?'),
      ]),
    ]),

    unit('es.u2', 'Les gens', 'Parler de sa famille et des autres', '👨‍👩‍👧', [
      lesson('es.u2.l1', 'La famille', 'Nommer ses proches', 'A1', [
        w('es.familia', 'la familia', 'famille', { pos: 'noun', gender: 'f' }),
        w('es.madre', 'la madre', 'mère', { pos: 'noun', gender: 'f' }),
        w('es.padre', 'el padre', 'père', { pos: 'noun', gender: 'm' }),
        w('es.hermano', 'el hermano', 'frère', { pos: 'noun', gender: 'm' }),
        w('es.hermana', 'la hermana', 'sœur', { pos: 'noun', gender: 'f' }),
        w('es.hijo', 'el hijo', 'fils', { pos: 'noun', gender: 'm' }),
        w('es.hija', 'la hija', 'fille (enfant)', { pos: 'noun', gender: 'f' }),
        w('es.marido', 'el marido', 'mari', { pos: 'noun', gender: 'm' }),
        w('es.mujer', 'la mujer', 'femme', { pos: 'noun', gender: 'f', note: '« Mujer » signifie à la fois « femme » et « épouse », selon le contexte.' }),
        s('es.s-familia-grande', 'Tengo una familia grande.', 'J’ai une grande famille.'),
      ]),
      lesson('es.u2.l2', 'Décrire quelqu’un', 'Dire comment sont les gens', 'A1', [
        w('es.amigo', 'el amigo', 'ami', { pos: 'noun', gender: 'm' }),
        w('es.hombre', 'el hombre', 'homme', { pos: 'noun', gender: 'm' }),
        w('es.nino', 'el niño', 'enfant', { pos: 'noun', gender: 'm' }),
        w('es.joven', 'joven', 'jeune', { pos: 'adj' }),
        w('es.viejo', 'viejo', 'vieux', { pos: 'adj' }),
        w('es.alto', 'alto', 'grand (taille)', { pos: 'adj' }),
        w('es.simpatico', 'simpático', 'sympathique', { pos: 'adj' }),
        s('es.s-mi-hermana', 'Mi hermana es profesora.', 'Ma sœur est professeure.'),
        s('es.s-es-muy', 'Es una persona muy amable.', 'C’est une personne très aimable.'),
      ]),
    ]),

    unit('es.u3', 'Manger et boire', 'Commander et se débrouiller à table', '🍽️', [
      lesson('es.u3.l1', 'Au bar', 'Commander une boisson', 'A1', [
        w('es.agua', 'el agua', 'eau', { pos: 'noun', gender: 'f', note: 'Féminin, mais on dit « el agua » : l’article change pour éviter deux « a » qui se heurtent.' }),
        w('es.cafe', 'el café', 'café', { pos: 'noun', gender: 'm' }),
        w('es.vino', 'el vino', 'vin', { pos: 'noun', gender: 'm' }),
        w('es.cerveza', 'la cerveza', 'bière', { pos: 'noun', gender: 'f' }),
        w('es.pan', 'el pan', 'pain', { pos: 'noun', gender: 'm' }),
        p('es.quisiera', 'quisiera…', 'je voudrais…', { pos: 'phrase' }),
        s('es.s-un-cafe', 'Quisiera un café, por favor.', 'Je voudrais un café, s’il vous plaît.'),
        s('es.s-la-cuenta', 'La cuenta, por favor.', 'L’addition, s’il vous plaît.'),
        s('es.s-tiene-agua', '¿Tiene agua sin gas?', 'Avez-vous de l’eau plate ?'),
      ]),
      lesson('es.u3.l2', 'Au restaurant', 'Choisir et payer', 'A2', [
        w('es.desayuno', 'el desayuno', 'petit-déjeuner', { pos: 'noun', gender: 'm' }),
        w('es.comida', 'la comida', 'déjeuner', { pos: 'noun', gender: 'f', note: 'En Espagne, « la comida » désigne le repas de midi, pris vers 14 h.' }),
        w('es.cena', 'la cena', 'dîner', { pos: 'noun', gender: 'f' }),
        w('es.carne', 'la carne', 'viande', { pos: 'noun', gender: 'f' }),
        w('es.pescado', 'el pescado', 'poisson', { pos: 'noun', gender: 'm' }),
        w('es.verduras', 'las verduras', 'légumes', { pos: 'noun', gender: 'f' }),
        w('es.rico', 'rico', 'délicieux', { pos: 'adj' }),
        s('es.s-mesa-dos', 'Una mesa para dos, por favor.', 'Une table pour deux, s’il vous plaît.'),
        s('es.s-soy-vegetariano', 'Soy vegetariano.', 'Je suis végétarien.'),
      ]),
    ]),

    unit('es.u4', 'Se déplacer', 'Trouver son chemin et prendre les transports', '🚉', [
      lesson('es.u4.l1', 'Demander son chemin', 'Ne jamais rester perdu', 'A1', [
        p('es.donde-esta', '¿dónde está…?', 'où est… ?', { pos: 'phrase' }),
        w('es.izquierda', 'la izquierda', 'gauche', { pos: 'noun', gender: 'f' }),
        w('es.derecha', 'la derecha', 'droite', { pos: 'noun', gender: 'f' }),
        p('es.todo-recto', 'todo recto', 'tout droit', { pos: 'adv' }),
        w('es.cerca', 'cerca', 'près', { pos: 'adv' }),
        w('es.lejos', 'lejos', 'loin', { pos: 'adv' }),
        s('es.s-donde-estacion', '¿Dónde está la estación?', 'Où est la gare ?'),
        s('es.s-estoy-perdido', 'Estoy perdido.', 'Je suis perdu.'),
        s('es.s-esta-lejos', '¿Está lejos de aquí?', 'Est-ce loin d’ici ?'),
        s('es.s-gire-izquierda', 'Gire a la izquierda en el semáforo.', 'Tournez à gauche au feu.'),
      ]),
      lesson('es.u4.l2', 'Les transports', 'Acheter un billet, monter à bord', 'A1', [
        w('es.tren', 'el tren', 'train', { pos: 'noun', gender: 'm' }),
        w('es.autobus', 'el autobús', 'bus', { pos: 'noun', gender: 'm' }),
        w('es.avion', 'el avión', 'avion', { pos: 'noun', gender: 'm' }),
        w('es.billete', 'el billete', 'billet', { pos: 'noun', gender: 'm' }),
        w('es.estacion', 'la estación', 'gare', { pos: 'noun', gender: 'f' }),
        w('es.calle', 'la calle', 'rue', { pos: 'noun', gender: 'f' }),
        s('es.s-un-billete', 'Un billete para Madrid, por favor.', 'Un billet pour Madrid, s’il vous plaît.'),
        s('es.s-a-que-hora', '¿A qué hora sale el próximo tren?', 'À quelle heure part le prochain train ?'),
        s('es.s-para-en', '¿Este autobús para en el museo?', 'Est-ce que ce bus s’arrête au musée ?'),
      ]),
    ]),

    unit('es.u5', 'Le quotidien', 'Chiffres, temps, habitudes', '🕐', [
      lesson('es.u5.l1', 'Compter', 'Les nombres qui servent tous les jours', 'A1', [
        w('es.uno', 'uno', 'un', { pos: 'number' }),
        w('es.dos', 'dos', 'deux', { pos: 'number' }),
        w('es.tres', 'tres', 'trois', { pos: 'number' }),
        w('es.cuatro', 'cuatro', 'quatre', { pos: 'number' }),
        w('es.cinco', 'cinco', 'cinq', { pos: 'number' }),
        w('es.diez', 'diez', 'dix', { pos: 'number' }),
        w('es.veinte', 'veinte', 'vingt', { pos: 'number' }),
        w('es.cien', 'cien', 'cent', { pos: 'number' }),
        s('es.s-cuanto-cuesta', '¿Cuánto cuesta?', 'Combien ça coûte ?'),
      ]),
      lesson('es.u5.l2', 'Le temps qui passe', 'Situer dans la journée et la semaine', 'A1', [
        w('es.hoy', 'hoy', 'aujourd’hui', { pos: 'adv' }),
        w('es.manana-adv', 'mañana', 'demain', { pos: 'adv', note: '« Mañana » signifie aussi « le matin » : c’est le contexte qui tranche.' }),
        w('es.ayer', 'ayer', 'hier', { pos: 'adv' }),
        w('es.ahora', 'ahora', 'maintenant', { pos: 'adv' }),
        w('es.tarde', 'la tarde', 'après-midi', { pos: 'noun', gender: 'f' }),
        w('es.noche', 'la noche', 'nuit', { pos: 'noun', gender: 'f' }),
        w('es.semana', 'la semana', 'semaine', { pos: 'noun', gender: 'f' }),
        s('es.s-que-hora', '¿Qué hora es?', 'Quelle heure est-il ?'),
        s('es.s-hasta-manana', 'Hasta mañana por la mañana.', 'À demain matin.'),
        s('es.s-libre-manana', '¿Estás libre mañana por la noche?', 'Es-tu libre demain soir ?'),
      ]),
    ]),

    unit('es.u6', 'Tenir une conversation', 'Comprendre, relancer, s’en sortir', '💬', [
      lesson('es.u6.l1', 'Quand on ne comprend pas', 'Les phrases qui débloquent tout', 'A1', [
        p('es.no-entiendo', 'no entiendo', 'je ne comprends pas', { pos: 'phrase' }),
        p('es.puede-repetir', '¿puede repetir?', 'pouvez-vous répéter ?', { pos: 'phrase' }),
        p('es.que-significa', '¿qué significa…?', 'que signifie… ?', { pos: 'phrase' }),
        p('es.como-se-dice', '¿cómo se dice… en español?', 'comment dit-on… en espagnol ?', { pos: 'phrase' }),
        p('es.no-se', 'no sé', 'je ne sais pas', { pos: 'phrase' }),
        s('es.s-poco-espanol', 'Hablo solo un poco de español.', 'Je ne parle qu’un peu espagnol.'),
        s('es.s-escribir', '¿Puede escribirlo?', 'Pouvez-vous l’écrire ?'),
        s('es.s-como-se-escribe', '¿Cómo se escribe?', 'Comment ça s’écrit ?'),
        s('es.s-otra-vez', 'Otra vez, más despacio, por favor.', 'Encore une fois, plus lentement, s’il vous plaît.'),
      ]),
      lesson('es.u6.l2', 'Donner son avis', 'Réagir à ce qu’on vous dit', 'A2', [
        w('es.bueno', 'bueno', 'bon', { pos: 'adj' }),
        w('es.malo', 'malo', 'mauvais', { pos: 'adj' }),
        w('es.bonito', 'bonito', 'joli', { pos: 'adj' }),
        w('es.dificil', 'difícil', 'difficile', { pos: 'adj' }),
        w('es.facil', 'fácil', 'facile', { pos: 'adj' }),
        p('es.creo-que', 'creo que…', 'je crois que…', { pos: 'phrase' }),
        p('es.estoy-de-acuerdo', 'estoy de acuerdo', 'je suis d’accord', { pos: 'phrase' }),
        s('es.s-me-gusta', 'Me gusta mucho.', 'J’aime beaucoup.'),
        s('es.s-no-estoy-seguro', 'No estoy seguro.', 'Je n’en suis pas certain.'),
      ]),
    ]),
  ],
});
