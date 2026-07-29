import { useEffect, useRef, useState } from 'react';
import type { Dialogue, LanguageProfile } from '@polyglotte/core';
import { canSpeakLanguage, speak, stopSpeaking, unlockSpeech } from '../speech/tts.js';
import { TargetText } from '../components/TargetText.js';
import type { Settings } from '../db/database.js';

interface DialogueExerciseProps {
  dialogue: Dialogue;
  profile: LanguageProfile;
  settings: Settings;
  onFinish: (result: { correct: number; total: number }) => void;
}

type Phase = 'listening' | 'questions' | 'review';

/**
 * Compréhension d'un dialogue.
 *
 * Trois temps, dans cet ordre précis :
 *
 *  1. **Écoute sans texte.** C'est le cœur de l'exercice. Afficher les
 *     répliques transformerait une épreuve de compréhension orale en lecture,
 *     et l'on ne travaillerait plus du tout la compétence visée.
 *  2. **Questions de compréhension**, portant sur le sens de l'échange et non
 *     sur un mot isolé — on cherche à savoir si l'on a suivi, pas si l'on a
 *     repéré.
 *  3. **Relecture ligne à ligne**, texte et traduction visibles, pour
 *     comprendre après coup ce qui a échappé. C'est le moment où l'on apprend
 *     réellement.
 *
 * Sans synthèse vocale — le cas de l'arabe tunisien — l'exercice bascule
 * silencieusement en compréhension écrite : les répliques sont affichées dès le
 * départ. Moins bien, mais infiniment mieux que de supprimer le dialogue.
 */
export function DialogueExercise({ dialogue, profile, settings, onFinish }: DialogueExerciseProps) {
  const audible = canSpeakLanguage(profile);
  const [phase, setPhase] = useState<Phase>('listening');
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    dialogue.questions.map(() => null),
  );
  const [checked, setChecked] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
      stopSpeaking();
    };
  }, [dialogue.id]);

  /** Joue l'échange d'une traite, en marquant la réplique en cours. */
  const playAll = async () => {
    if (!audible) return;
    unlockSpeech();
    for (let i = 0; i < dialogue.lines.length; i++) {
      if (cancelled.current) return;
      setPlayingLine(i);
      await speak(dialogue.lines[i]!.target, {
        lang: profile.bcp47,
        // Un cran plus lent que le mot isolé : dans un échange, c'est
        // l'enchaînement qui perd le débutant, pas chaque mot pris à part.
        rate: Math.max(0.6, settings.speechRate - 0.1),
      });
      // Une respiration entre les tours de parole, sans quoi les répliques se
      // collent et l'on ne sait plus qui parle.
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    }
    setPlayingLine(null);
  };

  const playLine = async (index: number) => {
    if (!audible) return;
    unlockSpeech();
    setPlayingLine(index);
    await speak(dialogue.lines[index]!.target, { lang: profile.bcp47, rate: settings.speechRate });
    setPlayingLine(null);
  };

  /**
   * Première écoute lancée d'elle-même : l'exercice commence par entendre, pas
   * par cliquer.
   *
   * La dépendance est volontairement réduite à l'identifiant du dialogue.
   * `playAll` est recréée à chaque rendu et la mettre en dépendance relancerait
   * l'échange depuis le début au moindre changement d'état — à chaque réponse
   * cochée, par exemple.
   */
  const startedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!audible || !settings.autoPlayAudio) return;
    if (startedFor.current === dialogue.id) return;
    startedFor.current = dialogue.id;
    void playAll();
  });

  const correctCount = dialogue.questions.reduce(
    (sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0),
    0,
  );
  const allAnswered = answers.every((a) => a !== null);

  return (
    <div className="exercise">
      <div className="dialogue-head">
        <span className="badge badge--accent">Dialogue</span>
        <h2>{dialogue.title}</h2>
        <p className="muted">{dialogue.setting}</p>
      </div>

      {/* --- Écoute ---------------------------------------------------- */}
      {phase === 'listening' ? (
        <div className="stack">
          {audible ? (
            <>
              <div className="prompt prompt--listen">
                <button
                  type="button"
                  className={`audio-btn ${playingLine !== null ? 'audio-btn--playing' : ''}`}
                  onClick={() => void playAll()}
                  aria-label="Écouter le dialogue"
                >
                  🔊
                </button>
                <p className="muted center">
                  {playingLine !== null
                    ? `Réplique ${playingLine + 1} sur ${dialogue.lines.length}`
                    : 'Écoutez l’échange en entier, autant de fois que nécessaire.'}
                </p>
                {/* Le texte reste caché : c'est ce qui fait de cet exercice une
                    épreuve d'écoute plutôt que de lecture. */}
                <div className="dialogue-bubbles" aria-hidden="true">
                  {dialogue.lines.map((line, index) => (
                    <span
                      key={index}
                      className={`bubble-dot ${line.speaker === 'a' ? 'bubble-dot--a' : 'bubble-dot--b'} ${
                        playingLine === index ? 'bubble-dot--active' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="muted center">
                Ne cherchez pas à tout comprendre. Repérez qui parle, de quoi, et ce qui est décidé.
              </p>
            </>
          ) : (
            <>
              <div className="feedback feedback--info">
                Aucune voix de synthèse n’existe en {profile.name.toLowerCase()}. L’échange est donc
                donné à lire — la compréhension orale reprendra ses droits quand des enregistrements
                de locuteurs natifs seront disponibles.
              </div>
              <DialogueScript dialogue={dialogue} profile={profile} settings={settings} showFr={false} />
            </>
          )}

          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            onClick={() => {
              stopSpeaking();
              setPlayingLine(null);
              setPhase('questions');
            }}
          >
            Répondre aux questions
          </button>
        </div>
      ) : null}

      {/* --- Questions --------------------------------------------------- */}
      {phase === 'questions' ? (
        <div className="stack">
          {audible ? (
            <button type="button" className="btn btn--ghost btn--block" onClick={() => void playAll()}>
              🔊 Réécouter le dialogue
            </button>
          ) : null}

          {dialogue.questions.map((q, qi) => (
            <div key={q.id} className="card stack stack--tight">
              <strong>{q.prompt}</strong>
              <div className="choices">
                {q.options.map((option, oi) => {
                  const picked = answers[qi] === oi;
                  const isRight = oi === q.answer;
                  const className = [
                    'choice',
                    checked && isRight ? 'choice--correct' : '',
                    checked && picked && !isRight ? 'choice--wrong' : '',
                    !checked && picked ? 'choice--picked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button
                      key={oi}
                      type="button"
                      className={className}
                      disabled={checked}
                      onClick={() =>
                        setAnswers((current) => current.map((a, i) => (i === qi ? oi : a)))
                      }
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {checked ? (
            <div
              className={`feedback ${correctCount === dialogue.questions.length ? 'feedback--correct' : 'feedback--info'}`}
            >
              <strong>
                {correctCount} bonne{correctCount > 1 ? 's' : ''} réponse
                {correctCount > 1 ? 's' : ''} sur {dialogue.questions.length}
              </strong>
              <p className="muted">
                {correctCount === dialogue.questions.length
                  ? 'Vous avez suivi l’échange. Relisez-le pour repérer les tournures utiles.'
                  : 'Relisez le dialogue ci-dessous : voir le texte après coup est le moment où l’oreille se corrige.'}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            disabled={!allAnswered}
            onClick={() => (checked ? setPhase('review') : setChecked(true))}
          >
            {checked ? 'Relire le dialogue' : 'Vérifier'}
          </button>
        </div>
      ) : null}

      {/* --- Relecture --------------------------------------------------- */}
      {phase === 'review' ? (
        <div className="stack">
          <DialogueScript
            dialogue={dialogue}
            profile={profile}
            settings={settings}
            showFr
            onPlayLine={audible ? (i) => void playLine(i) : undefined}
            playingLine={playingLine}
          />
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            onClick={() => {
              stopSpeaking();
              onFinish({ correct: correctCount, total: dialogue.questions.length });
            }}
          >
            Continuer
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Transcription de l'échange, en bulles alternées. */
function DialogueScript({
  dialogue,
  profile,
  settings,
  showFr,
  onPlayLine,
  playingLine,
}: {
  dialogue: Dialogue;
  profile: LanguageProfile;
  settings: Settings;
  showFr: boolean;
  onPlayLine?: (index: number) => void;
  playingLine?: number | null;
}) {
  return (
    <div className="script">
      {dialogue.lines.map((line, index) => (
        <div
          key={index}
          className={`script__line script__line--${line.speaker} ${
            playingLine === index ? 'script__line--active' : ''
          }`}
        >
          <button
            type="button"
            className="script__bubble"
            onClick={() => onPlayLine?.(index)}
            disabled={!onPlayLine}
          >
            <TargetText
              text={line.target}
              profile={profile}
              translit={line.translit}
              showTransliteration={settings.showTransliteration}
              size="sm"
            />
            {showFr ? <div className="script__fr">{line.fr}</div> : null}
          </button>
        </div>
      ))}
    </div>
  );
}
