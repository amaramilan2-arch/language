/**
 * Pack d'arabe tunisien (derja) — niveau A1 vers A2.
 *
 * Trois partis pris, qui distinguent ce pack des trois autres.
 *
 * 1. C'est bien la derja, pas l'arabe standard. Le tunisien qu'on entend dans la
 *    rue dit « قدّاش » et non « كم », « برشا » et non « كثيرا », « غدوة » et non
 *    « غدا ». Apprendre l'arabe standard pour parler à Tunis, c'est apprendre le
 *    latin pour commander un café à Rome.
 * 2. Translittération systématique, à côté de l'écriture arabe. La derja s'écrit
 *    peu et sans orthographe fixée ; exiger de déchiffrer l'alphabet arabe avant
 *    de pouvoir dire bonjour ferait abandonner tout le monde. Les deux systèmes
 *    sont affichés ensemble, et l'apprenant choisit son rythme.
 * 3. Notes d'usage abondantes. En derja plus qu'ailleurs, le mot juste est une
 *    question de registre et de situation, pas de dictionnaire.
 *
 * Convention de translittération, celle qu'utilisent les Tunisiens eux-mêmes
 * pour écrire en caractères latins :
 *   3 = ع   7 = ح   9 = ق   kh = خ   gh = غ   dh = ذ/ض   th = ث   ch = ش
 *
 * Limite technique assumée : aucun navigateur ne propose de voix de synthèse ni
 * de reconnaissance vocale pour la derja. Les exercices d'écoute et de
 * prononciation reposent donc sur de l'audio enregistré et sur l'auto-évaluation.
 * Voir `docs/ARCHITECTURE.md`, section « Le cas de l'arabe tunisien ».
 */

import { lesson, p, pack, s, unit, w } from '../schema.js';
import type { ContentPack } from '@polyglotte/core';

export const AEB: ContentPack = pack({
  language: 'aeb',
  version: 1,
  profile: {
    code: 'aeb',
    name: 'Arabe tunisien',
    flag: '🇹🇳',
    direction: 'rtl',
    // Repli sur l'arabe standard pour la synthèse : la prononciation sera
    // imparfaite, mais elle reste plus utile qu'un silence.
    bcp47: 'ar-TN',
    hasNativeTts: false,
    hasNativeAsr: false,
    needsTransliteration: true,
  },
  units: [
    unit('aeb.u1', 'Premiers contacts', 'Saluer, se présenter, rester poli', '👋', [
      lesson('aeb.u1.l1', 'Saluer', 'Aborder quelqu’un et prendre congé', 'A1', [
        p('aeb.3aslema', 'عسلامة', 'bonjour', { tr: '3aslèma', alt: ['salut'], pos: 'phrase', note: 'Le salut tunisien par excellence, à toute heure et avec tout le monde.' }),
        p('aeb.ahla', 'أهلا', 'salut', { tr: 'ahla', pos: 'phrase', note: 'Sert aussi à souhaiter la bienvenue.' }),
        p('aeb.sbeh-khir', 'صباح الخير', 'bonjour (le matin)', { tr: 'sbè7 el-khir', pos: 'phrase' }),
        p('aeb.msa-khir', 'مسا الخير', 'bonsoir', { tr: 'msa el-khir', pos: 'phrase' }),
        p('aeb.bislema', 'بسلامة', 'au revoir', { tr: 'bislèma', pos: 'phrase' }),
        p('aeb.chnowa-a7welek', 'شنوّة أحوالك؟', 'comment vas-tu ?', { tr: 'chnowa a7wèlek ?', pos: 'phrase' }),
        p('aeb.labes', 'لاباس؟', 'ça va ?', { tr: 'lèbès ?', pos: 'phrase', note: 'Question et réponse à la fois : « lèbès ? » — « lèbès. »' }),
        p('aeb.el7amdoulillah', 'الحمد لله', 'ça va, Dieu merci', { tr: 'el-7amdoulillah', pos: 'phrase', note: 'Réponse rituelle à « comment vas-tu ». S’emploie quel que soit l’état réel.' }),
        p('aeb.tcharrafna', 'تشرّفنا', 'enchanté', { tr: 'tcharrafna', pos: 'phrase' }),
      ]),
      lesson('aeb.u1.l2', 'Politesse', 'Demander et remercier', 'A1', [
        p('aeb.min-fadhlek', 'من فضلك', 's’il te plaît', { tr: 'min fadhlek', alt: ['s’il vous plaît'], pos: 'phrase' }),
        w('aeb.ya3ayshek', 'يعيشك', 'merci', { tr: 'ya3ayshek', pos: 'phrase', note: 'Littéralement « qu’il te fasse vivre ». C’est le merci tunisien courant ; « choukran » fait plus formel, voire étranger.' }),
        p('aeb.barcha-ya3ayshek', 'برشا يعيشك', 'merci beaucoup', { tr: 'barcha ya3ayshek', pos: 'phrase' }),
        p('aeb.blech-mziya', 'بلاش مزيّة', 'de rien', { tr: 'blèch mziya', pos: 'phrase' }),
        p('aeb.sam7ni', 'سامحني', 'excuse-moi', { tr: 'sèm7ni', pos: 'phrase' }),
        w('aeb.ey', 'إيه', 'oui', { tr: 'èy', pos: 'adv', note: 'Le « na3am » des manuels existe, mais on entend « èy » partout.' }),
        w('aeb.le', 'لا', 'non', { tr: 'lè', pos: 'adv' }),
        s('aeb.s-tnajem-t3awenni', 'تنجّم تعاوني؟', 'Peux-tu m’aider ?', { tr: 'tnajjem t3aweni ?' }),
        s('aeb.s-mafamech-mouchkel', 'ما فمّاش مشكل.', 'Il n’y a pas de problème.', { tr: 'ma fammèch mouchkel.' }),
      ]),
      lesson('aeb.u1.l3', 'Se présenter', 'Dire qui l’on est', 'A1', [
        p('aeb.chnowa-esmek', 'شنوّة إسمك؟', 'comment t’appelles-tu ?', { tr: 'chnowa esmek ?', pos: 'phrase' }),
        p('aeb.esmi', 'إسمي…', 'je m’appelle…', { tr: 'esmi…', pos: 'phrase' }),
        p('aeb.mnin-enti', 'منين إنتي؟', 'd’où viens-tu ?', { tr: 'mnin enti ?', pos: 'phrase' }),
        s('aeb.s-ena-men-fransa', 'آنا من فرنسا.', 'Je viens de France.', { tr: 'èna men fransa.' }),
        s('aeb.s-neskon', 'نسكن في باريس.', 'J’habite à Paris.', { tr: 'neskon fi Paris.' }),
        s('aeb.s-9addech-3omrek', 'قدّاش عمرك؟', 'Quel âge as-tu ?', { tr: '9addèch 3omrek ?' }),
        s('aeb.s-nekhdem', 'نخدم في بيرو.', 'Je travaille dans un bureau.', { tr: 'nekhdem fi birou.' }),
        s('aeb.s-net3allem', 'نتعلّم في التونسي.', 'J’apprends le tunisien.', { tr: 'net3allem fit-tounsi.' }),
        s('aeb.s-a7ki-bechwaya', 'أحكي بالشويّة من فضلك.', 'Parle doucement, s’il te plaît.', { tr: 'a7ki bech-chwaya min fadhlek.', note: 'La phrase à retenir en priorité : le tunisien se parle vite.' }),
      ]),
    ]),

    unit('aeb.u2', 'Les gens', 'Parler de sa famille et des autres', '👨‍👩‍👧', [
      lesson('aeb.u2.l1', 'La famille', 'Nommer ses proches', 'A1', [
        w('aeb.3ayla', 'عايلة', 'famille', { tr: '3ayla', pos: 'noun', gender: 'f' }),
        w('aeb.ommi', 'أمّي', 'ma mère', { tr: 'ommi', pos: 'noun', gender: 'f' }),
        w('aeb.bouya', 'بويا', 'mon père', { tr: 'bouya', pos: 'noun', gender: 'm', note: '« Bèba » s’entend aussi, surtout chez les enfants.' }),
        w('aeb.khouya', 'خويا', 'mon frère', { tr: 'khouya', pos: 'noun', gender: 'm' }),
        w('aeb.okhti', 'أختي', 'ma sœur', { tr: 'okhti', pos: 'noun', gender: 'f' }),
        w('aeb.weldi', 'ولدي', 'mon fils', { tr: 'weldi', pos: 'noun', gender: 'm' }),
        w('aeb.benti', 'بنتي', 'ma fille', { tr: 'benti', pos: 'noun', gender: 'f' }),
        w('aeb.rajel', 'راجل', 'homme', { tr: 'rajel', pos: 'noun', gender: 'm' }),
        w('aeb.mra', 'مرا', 'femme', { tr: 'mra', pos: 'noun', gender: 'f' }),
        s('aeb.s-3ayla-kbira', 'عندي عايلة كبيرة.', 'J’ai une grande famille.', { tr: '3andi 3ayla kbira.' }),
      ]),
      lesson('aeb.u2.l2', 'Décrire quelqu’un', 'Dire comment sont les gens', 'A1', [
        w('aeb.sa7bi', 'صاحبي', 'mon ami', { tr: 'sa7bi', pos: 'noun', gender: 'm' }),
        w('aeb.tfol', 'طفل', 'enfant', { tr: 'tfol', pos: 'noun', gender: 'm' }),
        w('aeb.sghir', 'صغير', 'petit', { tr: 'sghir', pos: 'adj' }),
        w('aeb.kbir', 'كبير', 'grand', { tr: 'kbir', pos: 'adj' }),
        w('aeb.dhrif', 'ظريف', 'sympathique', { tr: 'dhrif', pos: 'adj', note: 'Sert aussi pour « mignon » ou « charmant ».' }),
        w('aeb.jmil', 'جميل', 'beau', { tr: 'jmil', pos: 'adj' }),
        w('aeb.9wi', 'قوي', 'fort', { tr: '9wi', pos: 'adj' }),
        s('aeb.s-okhti-m3allma', 'أختي معلّمة.', 'Ma sœur est enseignante.', { tr: 'okhti m3allma.' }),
        s('aeb.s-3andi-zouz-khout', 'عندي زوز خوت.', 'J’ai deux frères.', { tr: '3andi zouz khout.' }),
      ]),
    ]),

    unit('aeb.u3', 'Manger et boire', 'Commander et se débrouiller à table', '🍽️', [
      lesson('aeb.u3.l1', 'Au café', 'Commander une boisson', 'A1', [
        w('aeb.ma', 'ماء', 'eau', { tr: 'mè', pos: 'noun' }),
        w('aeb.9ahwa', 'قهوة', 'café', { tr: '9ahwa', pos: 'noun', gender: 'f', note: 'Le café tunisien se boit serré. « 9ahwa 3arbi » désigne le café à la turque.' }),
        w('aeb.tey', 'تاي', 'thé', { tr: 'tey', pos: 'noun', note: 'Souvent servi très sucré, avec des pignons ou des amandes.' }),
        w('aeb.khobz', 'خبز', 'pain', { tr: 'khobz', pos: 'noun', gender: 'm' }),
        w('aeb.mekla', 'ماكلة', 'nourriture', { tr: 'mèkla', pos: 'noun', gender: 'f' }),
        p('aeb.n7eb', 'نحبّ…', 'je voudrais…', { tr: 'n7eb…', pos: 'phrase', note: 'Le même verbe sert pour « je veux » et « j’aime ».' }),
        s('aeb.s-n7eb-9ahwa', 'نحبّ قهوة من فضلك.', 'Je voudrais un café, s’il vous plaît.', { tr: 'n7eb 9ahwa min fadhlek.' }),
        s('aeb.s-el7seb', 'الحساب من فضلك.', 'L’addition, s’il vous plaît.', { tr: 'el-7sèb min fadhlek.' }),
        s('aeb.s-3andek-ma', 'عندك ماء بارد؟', 'Avez-vous de l’eau fraîche ?', { tr: '3andek mè bèred ?' }),
      ]),
      lesson('aeb.u3.l2', 'À table', 'Les repas et les goûts', 'A2', [
        w('aeb.ftour', 'فطور', 'petit-déjeuner', { tr: 'ftour', pos: 'noun', gender: 'm', note: 'Désigne aussi le repas de rupture du jeûne pendant le ramadan.' }),
        w('aeb.ghda', 'غدا', 'déjeuner', { tr: 'ghda', pos: 'noun', gender: 'm' }),
        w('aeb.3cha', 'عشاء', 'dîner', { tr: '3cha', pos: 'noun', gender: 'm' }),
        w('aeb.l7am', 'لحم', 'viande', { tr: 'l7am', pos: 'noun', gender: 'm' }),
        w('aeb.7out', 'حوت', 'poisson', { tr: '7out', pos: 'noun', gender: 'm', note: 'Faux ami de l’arabe standard, où « 7out » désigne la baleine.' }),
        w('aeb.khodhra', 'خضرة', 'légumes', { tr: 'khodhra', pos: 'noun', gender: 'f' }),
        w('aeb.bnin', 'بنين', 'délicieux', { tr: 'bnin', pos: 'adj' }),
        w('aeb.kosksi', 'كسكسي', 'couscous', { tr: 'kosksi', pos: 'noun', gender: 'm', note: 'Le plat du vendredi midi, servi en famille.' }),
        s('aeb.s-mekla-bnina', 'الماكلة بنينة برشا.', 'La nourriture est très bonne.', { tr: 'el-mèkla bnina barcha.' }),
      ]),
    ]),

    unit('aeb.u4', 'Se déplacer', 'Trouver son chemin et prendre les transports', '🚉', [
      lesson('aeb.u4.l1', 'Demander son chemin', 'Ne jamais rester perdu', 'A1', [
        p('aeb.win', 'وين…؟', 'où est… ?', { tr: 'win… ?', pos: 'phrase' }),
        p('aeb.3al-isar', 'على اليسار', 'à gauche', { tr: '3al-isèr', pos: 'phrase' }),
        p('aeb.3al-imin', 'على اليمين', 'à droite', { tr: '3al-imin', pos: 'phrase' }),
        w('aeb.toul', 'طول', 'tout droit', { tr: 'toul', pos: 'adv' }),
        w('aeb.9rib', 'قريب', 'proche', { tr: '9rib', pos: 'adj' }),
        w('aeb.b3id', 'بعيد', 'loin', { tr: 'b3id', pos: 'adj' }),
        s('aeb.s-win-ma7atta', 'وين المحطّة؟', 'Où est la gare ?', { tr: 'win el-ma7atta ?' }),
        s('aeb.s-toht', 'آنا توهت.', 'Je me suis perdu.', { tr: 'èna toht.' }),
        s('aeb.s-b3id-men-houni', 'بعيد من هوني؟', 'C’est loin d’ici ?', { tr: 'b3id men houni ?' }),
        s('aeb.s-dour-3al-isar', 'دور على اليسار.', 'Tourne à gauche.', { tr: 'dour 3al-isèr.' }),
      ]),
      lesson('aeb.u4.l2', 'Les transports', 'Se faire conduire', 'A1', [
        w('aeb.teksi', 'تاكسي', 'taxi', { tr: 'tèksi', pos: 'noun', gender: 'm' }),
        w('aeb.kar', 'كار', 'bus', { tr: 'kar', pos: 'noun', gender: 'm', note: 'Emprunt au français « car ». Le métro léger de Tunis se dit « mitro ».' }),
        w('aeb.tren', 'تران', 'train', { tr: 'trèn', pos: 'noun', gender: 'm' }),
        w('aeb.ma7atta', 'محطّة', 'gare', { tr: 'ma7atta', pos: 'noun', gender: 'f' }),
        w('aeb.teskra', 'تسكرة', 'ticket', { tr: 'teskra', pos: 'noun', gender: 'f' }),
        w('aeb.souq', 'سوق', 'marché', { tr: 'souq', pos: 'noun', gender: 'm' }),
        s('aeb.s-n7eb-nemchi', 'نحبّ نمشي للمدينة.', 'Je veux aller à la médina.', { tr: 'n7eb nemchi lil-medina.' }),
        s('aeb.s-9addech-teksi', 'قدّاش التاكسي للمطار؟', 'Combien coûte le taxi pour l’aéroport ?', { tr: '9addèch et-tèksi lil-matar ?' }),
        s('aeb.s-wa99efli', 'وقّفلي هوني من فضلك.', 'Arrêtez-moi ici, s’il vous plaît.', { tr: 'wa99efli houni min fadhlek.' }),
      ]),
    ]),

    unit('aeb.u5', 'Le quotidien', 'Chiffres, temps, habitudes', '🕐', [
      lesson('aeb.u5.l1', 'Compter', 'Les nombres qui servent tous les jours', 'A1', [
        w('aeb.we7ed', 'واحد', 'un', { tr: 'wè7ed', pos: 'number' }),
        w('aeb.zouz', 'زوز', 'deux', { tr: 'zouz', pos: 'number', note: 'Propre au tunisien : l’arabe standard dit « ithnèn », qu’on n’entend pas ici.' }),
        w('aeb.thletha', 'ثلاثة', 'trois', { tr: 'thlètha', pos: 'number' }),
        w('aeb.arb3a', 'أربعة', 'quatre', { tr: 'arb3a', pos: 'number' }),
        w('aeb.khamsa', 'خمسة', 'cinq', { tr: 'khamsa', pos: 'number', note: 'Aussi le nom de la main protectrice contre le mauvais œil.' }),
        w('aeb.3achra', 'عشرة', 'dix', { tr: '3achra', pos: 'number' }),
        w('aeb.3achrin', 'عشرين', 'vingt', { tr: '3achrin', pos: 'number' }),
        w('aeb.mya', 'ميّة', 'cent', { tr: 'mya', pos: 'number' }),
        s('aeb.s-9addech-yeswa', 'قدّاش يسوى؟', 'Combien ça coûte ?', { tr: '9addèch yeswa ?' }),
      ]),
      lesson('aeb.u5.l2', 'Le temps qui passe', 'Situer dans la journée et la semaine', 'A1', [
        w('aeb.el-youm', 'اليوم', 'aujourd’hui', { tr: 'el-youm', pos: 'adv' }),
        w('aeb.ghodwa', 'غدوة', 'demain', { tr: 'ghodwa', pos: 'adv', note: 'Très tunisien : l’arabe standard dit « ghadan ».' }),
        w('aeb.el-bere7', 'البارح', 'hier', { tr: 'el-bère7', pos: 'adv' }),
        w('aeb.tawwa', 'توّا', 'maintenant', { tr: 'tawwa', pos: 'adv' }),
        w('aeb.sbe7', 'صباح', 'matin', { tr: 'sbè7', pos: 'noun', gender: 'm' }),
        w('aeb.3chiya', 'عشيّة', 'après-midi', { tr: '3chiya', pos: 'noun', gender: 'f' }),
        w('aeb.lil', 'ليل', 'nuit', { tr: 'lil', pos: 'noun', gender: 'm' }),
        w('aeb.jom3a', 'جمعة', 'semaine', { tr: 'jom3a', pos: 'noun', gender: 'f', note: 'Le même mot désigne le vendredi : le contexte tranche.' }),
        s('aeb.s-9addech-se3a', 'قدّاش الساعة؟', 'Quelle heure est-il ?', { tr: '9addèch es-sè3a ?' }),
        s('aeb.s-fadhi-ghodwa', 'إنتي فاضي غدوة؟', 'Es-tu libre demain ?', { tr: 'enti fadhi ghodwa ?' }),
      ]),
    ]),

    unit('aeb.u6', 'Tenir une conversation', 'Comprendre, relancer, s’en sortir', '💬', [
      lesson('aeb.u6.l1', 'Quand on ne comprend pas', 'Les phrases qui débloquent tout', 'A1', [
        p('aeb.ma-fhemtech', 'ما فهمتش', 'je n’ai pas compris', { tr: 'ma fhemtech', pos: 'phrase', note: 'La négation tunisienne encadre le verbe : « ma… ch ». C’est la marque la plus reconnaissable du dialecte.' }),
        p('aeb.3awed', 'عاود من فضلك', 'répète, s’il te plaît', { tr: '3awed min fadhlek', pos: 'phrase' }),
        p('aeb.chnowa-ma3neha', 'شنوّة معناها…؟', 'que signifie… ?', { tr: 'chnowa ma3nèha… ?', pos: 'phrase' }),
        p('aeb.kifech-n9oul', 'كيفاش نقول…؟', 'comment dit-on… ?', { tr: 'kifèch n9oul… ?', pos: 'phrase' }),
        p('aeb.ma-na3refch', 'ما نعرفش', 'je ne sais pas', { tr: 'ma na3refch', pos: 'phrase' }),
        s('aeb.s-na7ki-chwaya', 'نحكي شويّة عربي.', 'Je parle un peu arabe.', { tr: 'na7ki chwaya 3arbi.' }),
        s('aeb.s-oktebhali', 'أكتبهالي من فضلك.', 'Écris-le-moi, s’il te plaît.', { tr: 'oktebhali min fadhlek.' }),
        s('aeb.s-3awed-marra', 'عاود مرّة أخرى بالشويّة.', 'Répète encore une fois, doucement.', { tr: '3awed marra okhra bech-chwaya.' }),
        s('aeb.s-chnowa-hadha', 'شنوّة هذا؟', 'Qu’est-ce que c’est ?', { tr: 'chnowa hèdha ?' }),
      ]),
      lesson('aeb.u6.l2', 'Donner son avis', 'Réagir à ce qu’on vous dit', 'A2', [
        w('aeb.behi', 'باهي', 'bien', { tr: 'bèhi', alt: ['d’accord'], pos: 'adj', note: 'Le mot le plus employé de la langue : approbation, accord, fin de conversation.' }),
        w('aeb.mli7', 'مليح', 'bon', { tr: 'mli7', pos: 'adj' }),
        w('aeb.khayeb', 'خايب', 'mauvais', { tr: 'khayeb', pos: 'adj' }),
        w('aeb.s3ib', 'صعيب', 'difficile', { tr: 's3ib', pos: 'adj' }),
        w('aeb.sehel', 'ساهل', 'facile', { tr: 'sèhel', pos: 'adj' }),
        w('aeb.barcha', 'برشا', 'beaucoup', { tr: 'barcha', pos: 'adv', note: 'Mot emblématique du tunisien, inconnu ailleurs dans le monde arabe.' }),
        w('aeb.chwaya', 'شويّة', 'un peu', { tr: 'chwaya', pos: 'adv' }),
        s('aeb.s-ya3jebni', 'يعجبني برشا.', 'Ça me plaît beaucoup.', { tr: 'ya3jebni barcha.' }),
        s('aeb.s-manich-mtakked', 'ما نيش متأكّد.', 'Je ne suis pas sûr.', { tr: 'manich mtakked.' }),
      ]),
    ]),
  ],
});
