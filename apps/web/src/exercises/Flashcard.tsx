import { useEffect, useState } from 'react';
import { DEFAULT_PARAMS, RATINGS, createMemory, previewIntervals } from '@polyglotte/core';
import type { CardMemory, Rating } from '@polyglotte/core';
import { AudioButton } from '../components/AudioButton.js';
import { ItemTarget } from '../components/TargetText.js';
import { formatInterval } from '../components/ui.js';
import type { ExerciseProps } from './types.js';

interface FlashcardProps extends ExerciseProps {
  /** Mémoire actuelle, pour prévisualiser les intervalles. */
  memory?: CardMemory | undefined;
}

/**
 * Carte mémoire classique : on montre, on réfléchit, on retourne, on s'auto-évalue.
 *
 * C'est le format d'introduction d'un élément et le refuge en cas d'échec
 * répété. L'auto-évaluation à quatre niveaux y a tout son sens : l'apprenant est
 * le seul à savoir si la réponse lui est venue immédiatement ou après un effort.
 * C'est aussi le seul exercice qui alimente FSRS en notes « facile », dont
 * l'algorithme a besoin pour allonger franchement les intervalles.
 */
export function Flashcard({
  item,
  profile,
  settings,
  isFirstEncounter,
  onAnswer,
  memory,
}: FlashcardProps) {
  const [revealed, setRevealed] = useState(isFirstEncounter);

  // Une nouvelle carte doit repartir face cachée, sinon l'exercice suivant
  // s'affiche déjà retourné.
  useEffect(() => setRevealed(isFirstEncounter), [item.id, isFirstEncounter]);

  const baseMemory =
    memory ?? createMemory(`${item.id}::recognize`, item.id, 'recognize', profile.code, Date.now());
  const intervals = previewIntervals(baseMemory, Date.now(), {
    desiredRetention: settings.desiredRetention,
    params: DEFAULT_PARAMS,
    maximumIntervalDays: 1825,
  });

  const answer = (rating: Rating) => onAnswer({ rating, correct: rating > RATINGS.again });

  return (
    <div className="exercise">
      <p className="muted center">
        {isFirstEncounter ? 'Nouveau mot' : 'Vous souvenez-vous de la traduction ?'}
      </p>

      <div className="prompt">
        <ItemTarget item={item} profile={profile} showTransliteration={settings.showTransliteration} />
        <AudioButton
          text={item.target}
          profile={profile}
          rate={settings.speechRate}
          autoPlay={settings.autoPlayAudio}
        />

        {revealed ? (
          <>
            <div style={{ fontSize: '1.3rem', color: 'var(--text-strong)' }}>{item.fr}</div>
            {item.example ? (
              <div className="muted">
                <div dir={profile.direction}>{item.example}</div>
                {item.exampleFr ? <div>{item.exampleFr}</div> : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {item.note && revealed ? <div className="note">{item.note}</div> : null}

      {revealed ? (
        <div className="ratings">
          <button type="button" className="rating rating--again" onClick={() => answer(RATINGS.again)}>
            À revoir
            <small>{formatInterval(intervals[RATINGS.again])}</small>
          </button>
          <button type="button" className="rating rating--hard" onClick={() => answer(RATINGS.hard)}>
            Difficile
            <small>{formatInterval(intervals[RATINGS.hard])}</small>
          </button>
          <button type="button" className="rating rating--good" onClick={() => answer(RATINGS.good)}>
            Correct
            <small>{formatInterval(intervals[RATINGS.good])}</small>
          </button>
          <button type="button" className="rating rating--easy" onClick={() => answer(RATINGS.easy)}>
            Facile
            <small>{formatInterval(intervals[RATINGS.easy])}</small>
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={() => setRevealed(true)}>
          Afficher la réponse
        </button>
      )}
    </div>
  );
}
