/**
 * Reconnaissance vocale, via l'API Web Speech du navigateur.
 *
 * Sert à l'expression orale : l'apprenant prononce, on transcrit, on compare à
 * la forme attendue. Aucune donnée ne quitte l'appareil sur Safari ; Chrome, lui,
 * envoie l'audio à un service Google. L'interface le signale — c'est le genre de
 * détail qu'on découvre autrement au mauvais moment.
 *
 * Disponibilité inégale : Chrome et Safari oui, Firefox non, arabe tunisien
 * jamais. Le repli est l'auto-évaluation, où l'apprenant écoute le modèle,
 * répète et juge lui-même. C'est moins précis, mais c'est ce que fait n'importe
 * quel apprenant sérieux avec un enregistrement — et cela vaut infiniment mieux
 * que de supprimer l'exercice.
 */

import { levenshtein, normalizeDeep } from '@polyglotte/core';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isAsrSupported(): boolean {
  return getConstructor() !== null;
}

export interface ListenOptions {
  lang: string;
  /** Durée maximale d'écoute, en millisecondes. */
  timeoutMs?: number;
  /** Appelé à chaque hypothèse intermédiaire, pour afficher en direct. */
  onPartial?: (transcript: string) => void;
}

export interface ListenResult {
  transcript: string;
  confidence: number;
  /** Pourquoi l'écoute s'est arrêtée. */
  reason: 'final' | 'timeout' | 'error' | 'aborted';
  error?: string;
}

let activeRecognition: SpeechRecognitionLike | null = null;

/**
 * Écoute le micro et renvoie la meilleure transcription.
 *
 * Un délai de garde est indispensable : sur plusieurs navigateurs, la
 * reconnaissance ne déclenche jamais `onend` si l'utilisateur ne dit rien du
 * tout, et l'exercice resterait bloqué en écoute indéfiniment.
 */
export function listen(options: ListenOptions): Promise<ListenResult> {
  const Constructor = getConstructor();
  if (!Constructor) {
    return Promise.resolve({
      transcript: '',
      confidence: 0,
      reason: 'error',
      error: 'La reconnaissance vocale n’est pas disponible sur ce navigateur.',
    });
  }

  stopListening();

  return new Promise((resolve) => {
    const recognition = new Constructor();
    recognition.lang = options.lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    let best = '';
    let confidence = 0;
    let settled = false;

    const finish = (reason: ListenResult['reason'], error?: string) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      activeRecognition = null;
      try {
        recognition.abort();
      } catch {
        // Déjà arrêtée : sans intérêt.
      }
      resolve({ transcript: best.trim(), confidence, reason, ...(error ? { error } : {}) });
    };

    const timer = window.setTimeout(() => finish(best ? 'final' : 'timeout'), options.timeoutMs ?? 7000);

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const alternative = result[0];
        if (!alternative) continue;

        if (result.isFinal) {
          best = alternative.transcript;
          confidence = alternative.confidence;
          finish('final');
          return;
        }
        best = alternative.transcript;
        options.onPartial?.(best);
      }
    };

    recognition.onerror = (event) => {
      const messages: Record<string, string> = {
        'no-speech': 'Aucune parole détectée. Rapprochez-vous du micro.',
        'audio-capture': 'Micro introuvable.',
        'not-allowed': 'Accès au micro refusé.',
        network: 'La reconnaissance vocale nécessite une connexion sur ce navigateur.',
      };
      finish('error', messages[event.error] ?? `Erreur de reconnaissance : ${event.error}`);
    };

    recognition.onend = () => finish(best ? 'final' : 'timeout');

    activeRecognition = recognition;
    try {
      recognition.start();
    } catch (error) {
      finish('error', error instanceof Error ? error.message : 'Impossible de démarrer l’écoute.');
    }
  });
}

export function stopListening(): void {
  if (!activeRecognition) return;
  try {
    activeRecognition.abort();
  } catch {
    // Sans conséquence.
  }
  activeRecognition = null;
}

/** Le micro est-il autorisé ? Ne déclenche aucune demande de permission. */
export async function hasMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions) return false;
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state !== 'denied';
  } catch {
    // Firefox ne connaît pas la permission « microphone » : on reste optimiste
    // plutôt que de désactiver l'exercice à tort.
    return true;
  }
}

export interface PronunciationScore {
  /** Score dans [0, 1]. */
  score: number;
  /** Verdict lisible, affiché à l'apprenant. */
  verdict: 'excellent' | 'bon' | 'passable' | 'insuffisant';
  transcript: string;
  expected: string;
}

/**
 * Compare une transcription à la forme attendue.
 *
 * Le score est délibérément indulgent. La reconnaissance vocale est elle-même
 * approximative — accent non natif, bruit ambiant, micro médiocre — et elle
 * confond régulièrement des mots proches. Sanctionner durement reviendrait à
 * punir l'apprenant pour les limites de l'outil, sur l'exercice qui demande
 * déjà le plus de courage.
 */
export function scorePronunciation(transcript: string, expected: string): PronunciationScore {
  const a = normalizeDeep(transcript);
  const b = normalizeDeep(expected);

  if (!a) {
    return { score: 0, verdict: 'insuffisant', transcript, expected };
  }

  const distance = levenshtein(a, b);
  const score = Math.max(0, 1 - distance / Math.max(b.length, 1));

  const verdict: PronunciationScore['verdict'] =
    score >= 0.9 ? 'excellent' : score >= 0.7 ? 'bon' : score >= 0.5 ? 'passable' : 'insuffisant';

  return { score, verdict, transcript, expected };
}
