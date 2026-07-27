import { useCallback, useEffect, useRef, useState } from 'react';
import type { LanguageProfile } from '@polyglotte/core';
import { hasVoiceFor, speak, stopSpeaking } from '../speech/tts.js';

interface AudioButtonProps {
  text: string;
  profile: LanguageProfile;
  rate?: number;
  size?: 'lg' | 'sm';
  /** Déclenche la lecture dès l'affichage. */
  autoPlay?: boolean;
  label?: string;
}

/**
 * Bouton de lecture d'un texte dans la langue cible.
 *
 * Se désactive proprement lorsqu'aucune voix n'est installée pour la langue,
 * plutôt que de rester cliquable sans rien produire — un bouton qui ne fait
 * rien est plus déroutant qu'un bouton absent, et donne l'impression que
 * l'application est cassée.
 */
export function AudioButton({
  text,
  profile,
  rate = 0.9,
  size = 'lg',
  autoPlay = false,
  label,
}: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const available = hasVoiceFor(profile.bcp47);
  // Évite de relire au moindre rendu : sans cette garde, changer un état sans
  // rapport (afficher un indice, par exemple) relancerait l'audio.
  const autoPlayedFor = useRef<string | null>(null);

  const play = useCallback(async () => {
    if (!available) return;
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
      aria-label={label ?? `Écouter : ${text}`}
      title={available ? undefined : `Aucune voix ${profile.name.toLowerCase()} installée sur cet appareil`}
    >
      {available ? '🔊' : '🔇'}
    </button>
  );
}

/** Message expliquant l'absence de voix, à afficher à côté du bouton. */
export function VoiceWarning({ profile }: { profile: LanguageProfile }) {
  if (hasVoiceFor(profile.bcp47)) return null;
  return (
    <p className="muted center">
      Aucune voix {profile.name.toLowerCase()} n’est installée sur cet appareil. L’exercice reste
      jouable, mais sans audio — vous pouvez ajouter une voix dans les réglages de votre système.
    </p>
  );
}
