/**
 * Synthèse vocale, via l'API Web Speech du navigateur.
 *
 * Aucun service externe, aucune clé d'API, aucun coût, aucune latence réseau.
 * En contrepartie, la qualité et la disponibilité des voix dépendent entièrement
 * du système de l'utilisateur, et l'écart est considérable : excellent sur iOS
 * et macOS, correct sur Android, très inégal sur Linux.
 *
 * Ce module ne masque jamais une absence de voix. Il l'expose, pour que
 * l'interface puisse le dire honnêtement et que le planificateur cesse de
 * produire des exercices d'écoute qui resteraient muets.
 */

export interface SpeakOptions {
  /** Étiquette BCP-47 de la langue, par exemple `es-ES`. */
  lang: string;
  /** Vitesse, dans [0,5 ; 1,2]. Plus lent aide énormément le débutant. */
  rate?: number;
  pitch?: number;
}

/** L'API de synthèse est-elle présente ? */
export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Déverrouillage de la synthèse vocale.
 *
 * Les navigateurs refusent de parler tant que l'utilisateur n'a pas interagi
 * avec la page : la toute première lecture automatique est avalée sans erreur.
 * On émet donc un énoncé vide au premier geste, ce qui débloque le moteur pour
 * le reste de la session. Sans cela, le mot d'ouverture de chaque session reste
 * muet — exactement le défaut qui donne l'impression qu'il faut cliquer.
 */
let unlocked = false;

export function unlockSpeech(): void {
  if (unlocked || !isTtsSupported()) return;
  unlocked = true;
  try {
    const primer = new SpeechSynthesisUtterance('');
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  } catch {
    // Sans conséquence : au pire la première lecture sera silencieuse.
  }
}

export function installSpeechUnlock(): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => unlockSpeech();
  const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
  for (const event of events) window.addEventListener(event, handler, { once: true, passive: true });
  return () => {
    for (const event of events) window.removeEventListener(event, handler);
  };
}

let voiceCache: SpeechSynthesisVoice[] = [];

/**
 * Charge la liste des voix.
 *
 * Chrome peuple cette liste de façon asynchrone et renvoie un tableau vide au
 * premier appel : c'est le piège classique de cette API. On attend donc
 * l'événement `voiceschanged`, avec un délai de garde pour ne jamais bloquer
 * l'interface si l'événement n'arrive pas.
 */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isTtsSupported()) return Promise.resolve([]);

  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) {
    voiceCache = immediate;
    return Promise.resolve(immediate);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      voiceCache = window.speechSynthesis.getVoices();
      resolve(voiceCache);
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish);
    window.setTimeout(finish, timeoutMs);
  });
}

/**
 * Meilleure voix disponible pour une langue.
 *
 * On cherche d'abord la correspondance exacte (`es-ES`), puis la langue seule
 * (`es-MX` fera l'affaire pour `es-ES`). Une voix avec le bon accent régional
 * est préférable, mais une voix au mauvais accent vaut infiniment mieux que le
 * silence.
 */
export function pickVoice(lang: string, voices = voiceCache): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const normalized = lang.toLowerCase();
  const base = normalized.split('-')[0] ?? normalized;

  return (
    voices.find((v) => v.lang.toLowerCase() === normalized) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(`${base}-`)) ??
    voices.find((v) => v.lang.toLowerCase() === base) ??
    null
  );
}

/** Une voix utilisable existe-t-elle pour cette langue ? */
export function hasVoiceFor(lang: string): boolean {
  return pickVoice(lang) !== null;
}

/**
 * La synthèse est-elle acceptable pour cette langue ?
 *
 * Le profil fait autorité, et pas seulement la présence d'une voix dans le
 * système. C'est la leçon de l'arabe tunisien : le repli de `pickVoice` trouve
 * une voix d'arabe standard pour `ar-TN`, qui lit le derja avec une
 * prononciation fausse. Entendre une mauvaise prononciation est pire que ne
 * rien entendre — cela ancre une erreur qu'il faudra ensuite désapprendre.
 *
 * Une langue déclarée sans synthèse native reste donc silencieuse jusqu'à ce
 * que de l'audio enregistré soit disponible.
 */
export function canSpeakLanguage(profile: { bcp47: string; hasNativeTts: boolean }): boolean {
  if (!profile.hasNativeTts) return false;
  return hasVoiceFor(profile.bcp47);
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Prononce un texte. La promesse se résout à la fin de la lecture.
 *
 * Toute lecture en cours est interrompue : appuyer deux fois sur le bouton
 * audio doit relire depuis le début, pas empiler deux voix superposées.
 */
export function speak(text: string, options: SpeakOptions): Promise<void> {
  if (!isTtsSupported() || !text.trim()) return Promise.resolve();

  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang;
    utterance.rate = Math.min(Math.max(options.rate ?? 0.9, 0.5), 1.5);
    utterance.pitch = options.pitch ?? 1;

    const voice = pickVoice(options.lang);
    if (voice) utterance.voice = voice;

    // On résout aussi sur erreur : l'appelant veut savoir que la lecture est
    // terminée, pas pourquoi elle a échoué. Une promesse qui ne se résout
    // jamais figerait l'exercice.
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isTtsSupported() && window.speechSynthesis.speaking;
}

export function currentText(): string | null {
  return currentUtterance?.text ?? null;
}
