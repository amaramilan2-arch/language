import { useEffect, useState } from 'react';
import { RATINGS } from '@polyglotte/core';
import type { Rating } from '@polyglotte/core';
import { AudioButton } from '../components/AudioButton.js';
import { ItemTarget } from '../components/TargetText.js';
import { isAsrSupported, listen, scorePronunciation, stopListening } from '../speech/asr.js';
import type { PronunciationScore } from '../speech/asr.js';
import type { ExerciseProps } from './types.js';

type Phase = 'ready' | 'listening' | 'scored' | 'selfAssess';

/**
 * Expression orale : écouter le modèle, puis répéter à voix haute.
 *
 * L'exercice le plus important du projet — l'objectif annoncé est de parler,
 * pas de rédiger — et le plus difficile à réaliser correctement dans un
 * navigateur.
 *
 * Deux modes, choisis automatiquement :
 *
 *  - Reconnaissance vocale, quand le navigateur la propose pour la langue. On
 *    transcrit et on compare. Le score est volontairement indulgent : l'outil
 *    se trompe souvent sur un accent non natif, et punir l'apprenant pour les
 *    limites du micro serait absurde sur l'exercice qui demande déjà le plus
 *    d'effort.
 *  - Auto-évaluation, sinon — notamment en arabe tunisien, qu'aucun moteur ne
 *    reconnaît. L'apprenant écoute, répète, compare et juge. C'est exactement
 *    ce que fait n'importe qui travaillant avec un enregistrement, et cela vaut
 *    infiniment mieux que de supprimer l'exercice.
 */
export function SpeakRepeat({ item, profile, settings, onAnswer }: ExerciseProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [partial, setPartial] = useState('');
  const [score, setScore] = useState<PronunciationScore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const asrAvailable = isAsrSupported() && profile.hasNativeAsr;

  useEffect(() => {
    setPhase('ready');
    setPartial('');
    setScore(null);
    setError(null);
    return () => stopListening();
  }, [item.id]);

  const record = async () => {
    setPhase('listening');
    setPartial('');
    setError(null);

    const result = await listen({
      lang: profile.bcp47,
      timeoutMs: 6000,
      onPartial: setPartial,
    });

    if (result.reason === 'error') {
      setError(result.error ?? 'La reconnaissance a échoué.');
      setPhase('selfAssess');
      return;
    }
    if (!result.transcript) {
      setError('Rien n’a été entendu. Réessayez, ou évaluez-vous vous-même.');
      setPhase('selfAssess');
      return;
    }

    setScore(scorePronunciation(result.transcript, item.target));
    setPhase('scored');
  };

  const finish = (rating: Rating) => onAnswer({ rating, correct: rating > RATINGS.again });

  return (
    <div className="exercise">
      <p className="muted center">Écoutez, puis répétez à voix haute</p>

      <div className="prompt">
        <ItemTarget item={item} profile={profile} showTransliteration={settings.showTransliteration} />
        <div className="muted">{item.fr}</div>
        <AudioButton
          text={item.target}
          profile={profile}
          rate={settings.speechRate}
          autoPlay={settings.autoPlayAudio}
          label={`Écouter le modèle : ${item.target}`}
        />
      </div>

      {phase === 'listening' && partial ? (
        <div className="feedback feedback--info">
          <span className="muted">Entendu : </span>
          {partial}
        </div>
      ) : null}

      {error ? <div className="feedback feedback--info">{error}</div> : null}

      {phase === 'scored' && score ? (
        <div
          className={`feedback ${score.score >= 0.7 ? 'feedback--correct' : 'feedback--info'}`}
        >
          <strong>
            {score.verdict === 'excellent'
              ? 'Excellente prononciation'
              : score.verdict === 'bon'
                ? 'Bonne prononciation'
                : score.verdict === 'passable'
                  ? 'Compréhensible, à affiner'
                  : 'Difficile à reconnaître'}
          </strong>
          <p className="muted">Transcrit : « {score.transcript} »</p>
          <p className="muted">
            La reconnaissance vocale se trompe souvent sur un accent non natif. Fiez-vous d’abord à
            la comparaison avec le modèle.
          </p>
        </div>
      ) : null}

      {phase === 'ready' ? (
        <div className="stack stack--tight" style={{ alignItems: 'center' }}>
          {asrAvailable ? (
            <>
              <button type="button" className="mic-btn" onClick={() => void record()} aria-label="Enregistrer">
                🎤
              </button>
              <p className="muted center">Appuyez, puis prononcez la phrase</p>
              <button type="button" className="btn btn--ghost" onClick={() => setPhase('selfAssess')}>
                Passer l’enregistrement
              </button>
            </>
          ) : (
            <>
              <p className="muted center">
                {profile.code === 'aeb'
                  ? 'Aucun moteur de reconnaissance vocale ne prend en charge l’arabe tunisien.'
                  : 'La reconnaissance vocale n’est pas disponible sur ce navigateur.'}{' '}
                Écoutez le modèle, répétez à voix haute, puis évaluez-vous.
              </p>
              <button
                type="button"
                className="btn btn--primary btn--block btn--lg"
                onClick={() => setPhase('selfAssess')}
              >
                J’ai répété à voix haute
              </button>
            </>
          )}
        </div>
      ) : null}

      {phase === 'listening' ? (
        <div className="stack stack--tight" style={{ alignItems: 'center' }}>
          <button type="button" className="mic-btn mic-btn--recording" disabled aria-label="Écoute en cours">
            🎤
          </button>
          <p className="muted">À vous…</p>
        </div>
      ) : null}

      {phase === 'scored' || phase === 'selfAssess' ? (
        <div className="stack stack--tight">
          <p className="muted center">Comment jugez-vous votre prononciation ?</p>
          <div className="ratings">
            <button type="button" className="rating rating--again" onClick={() => finish(RATINGS.again)}>
              À refaire
            </button>
            <button type="button" className="rating rating--hard" onClick={() => finish(RATINGS.hard)}>
              Hésitante
            </button>
            <button type="button" className="rating rating--good" onClick={() => finish(RATINGS.good)}>
              Correcte
            </button>
            <button type="button" className="rating rating--easy" onClick={() => finish(RATINGS.easy)}>
              Fluide
            </button>
          </div>
          {asrAvailable ? (
            <button type="button" className="btn btn--ghost btn--block" onClick={() => void record()}>
              Réessayer l’enregistrement
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
