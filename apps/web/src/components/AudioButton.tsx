import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageProfile } from '@polyglotte/core';
import { canSpeakLanguage, speak, stopSpeaking, unlockSpeech } from '../speech/tts.js';

interface AudioButtonProps {
  text: string;
  profile: LanguageProfile;
  rate?: number;
  size?: 'lg' | 'sm';
  /**
   * Lance la lecture dès l'affichage. Vaut `true` par défaut : entendre le mot
   * au moment où il apparaît est le comportement attendu d'une application
   * d'oral. Ne le passer à `false` que lorsque prononcer la réponse la
   * révélerait — en dictée, par exemple.
   */
  autoPlay?: boolean;
  label?: string;
}

/**
 * Bouton de lecture d'un texte dans la langue cible.
 *
 * Se désactive proprement lorsque la langue n'a pas de synthèse acceptable,
 * plutôt que de rester cliquable sans rien produire — ou pire, de prononcer
 * faux. Le bouton reste visible pour permettre la réécoute après la lecture
 * automatique.
 */
export function AudioButton({
  text,
  profile,
  rate = 0.9,
  size = 'lg',
  autoPlay = true,
  label,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const available = canSpeakLanguage(profile);
  // Évite de relire au moindre rendu : sans cette garde, changer un état sans
  // rapport (afficher un indice, par exemple) relancerait l'audio.
  const autoPlayedFor = useRef<string | null>(null);

  const play = useCallback(async () => {
    if (!available) return;
    // Un appui sur le bouton est un geste utilisateur : c'est le moment idéal
    // pour débloquer le moteur si la lecture automatique a été refusée.
    unlockSpeech();
    setPlaying(true);
    await speak(text, { lang: profile.bcp47, rate });
    setPlaying(false);
  }, [available, text, profile.bcp47, rate]);

  useEffect(() => {
    if (!autoPlay || !available) return;
    if (autoPlayedFor.current === text) return;
    autoPlayedFor.current = text;
    void play();
  }, [autoPlay, available, play, text]);

  useEffect(() => () => stopSpeaking(), []);

  const classes = [
    'audio-btn',
    size === 'sm' ? 'audio-btn--sm' : '',
    playing ? 'audio-btn--playing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      onClick={() => void play()}
      disabled={!available}
      aria-label={label ?? `Réécouter : ${text}`}
      title={available ? 'Réécouter' : `Audio indisponible en ${profile.name.toLowerCase()}`}
    >
      {available ? '🔊' : '🔇'}
    </button>
  );
}

/**
 * Message expliquant l'absence d'audio.
 *
 * Distingue les deux causes, parce qu'elles n'appellent pas la même réaction :
 * une voix manquante se règle dans le système, une langue sans synthèse
 * n'attend rien de l'utilisateur.
 */
export function VoiceWarning({ profile }: { profile: LanguageProfile }) {
  if (canSpeakLanguage(profile)) return null;

  if (!profile.hasNativeTts) {
    return (
      <p className="muted center">
        Aucune voix de synthèse n’existe pour {profile.name.toLowerCase()}. Plutôt que de faire lire
        le texte par une voix d’arabe standard — qui prononcerait faux et vous ferait retenir une
        erreur — l’audio reste muet en attendant des enregistrements de locuteurs natifs.
      </p>
    );
  }

  return (
    <p className="muted center">
      Aucune voix {profile.name.toLowerCase()} n’est installée sur cet appareil. Vous pouvez en
      ajouter une dans les réglages de votre système ; l’exercice reste jouable sans audio.
    </p>
  );
}
