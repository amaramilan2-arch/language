import { useEffect, useMemo, useState } from 'react';
import { buildSentenceTokens, createRng, normalizeDeep } from '@polyglotte/core';
import { AudioButton } from '../components/AudioButton.js';
import { ItemTarget } from '../components/TargetText.js';
import { autoRating, type ExerciseProps } from './types.js';

/**
 * Reconstitution d'une phrase à partir de blocs de mots mélangés.
 *
 * Palier intermédiaire indispensable entre reconnaître et écrire de mémoire.
 * L'exercice porte sur l'ordre des mots — c'est-à-dire sur la syntaxe — sans
 * exiger de se souvenir de l'orthographe, ce qui permet de travailler une chose
 * à la fois. C'est particulièrement précieux en arabe tunisien, où le clavier
 * arabe est un obstacle en soi.
 */
export function BuildSentence({ item, profile, settings, seed, onAnswer }: ExerciseProps) {
  const { tokens, shuffled } = useMemo(
    () => buildSentenceTokens(item.target, createRng(seed)),
    [item.target, seed],
  );

  /** Indices dans `shuffled` des blocs déjà posés, dans l'ordre de la réponse. */
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);

  useEffect(() => {
    setPlaced([]);
    setChecked(null);
  }, [item.id, seed]);

  const answer = placed.map((index) => shuffled[index]).join(' ');
  const complete = placed.length === tokens.length;
  const rtl = profile.direction === 'rtl';

  const submit = () => {
    if (checked !== null) {
      onAnswer({ rating: autoRating(checked, false), correct: checked });
      return;
    }
    // Comparaison sur la forme normalisée : la ponctuation attachée à un bloc
    // ne doit pas invalider un ordre par ailleurs correct.
    const correct = normalizeDeep(answer) === normalizeDeep(tokens.join(' '));
    setChecked(correct);
  };

  return (
    <div className="exercise">
      <p className="muted center">Reconstituez la phrase</p>

      <div className="prompt">
        <div className="target target--sm">{item.fr}</div>
        <AudioButton
          text={item.target}
          profile={profile}
          rate={settings.speechRate}
          size="sm"
          autoPlay={false}
        />
      </div>

      <div
        className={`tokens ${placed.length > 0 ? 'tokens--filled' : ''} ${rtl ? 'tokens--rtl' : ''}`}
        aria-label="Votre phrase"
      >
        {placed.map((tokenIndex, position) => (
          <button
            key={`${tokenIndex}-${position}`}
            type="button"
            className="token"
            onClick={() => checked === null && setPlaced(placed.filter((_, i) => i !== position))}
            lang={profile.bcp47}
          >
            {shuffled[tokenIndex]}
          </button>
        ))}
      </div>

      <div className={`tokens ${rtl ? 'tokens--rtl' : ''}`} aria-label="Mots disponibles">
        {shuffled.map((token, index) => (
          <button
            key={`${token}-${index}`}
            type="button"
            className={`token ${placed.includes(index) ? 'token--used' : ''}`}
            onClick={() => checked === null && !placed.includes(index) && setPlaced([...placed, index])}
            disabled={placed.includes(index) || checked !== null}
            lang={profile.bcp47}
          >
            {token}
          </button>
        ))}
      </div>

      {checked !== null ? (
        <div className={`feedback ${checked ? 'feedback--correct' : 'feedback--wrong'}`}>
          <strong>{checked ? 'Correct' : 'La phrase correcte est :'}</strong>
          {!checked ? (
            <div style={{ marginTop: 8 }}>
              <ItemTarget
                item={item}
                profile={profile}
                showTransliteration={settings.showTransliteration}
                size="sm"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="btn btn--primary btn--block btn--lg"
        onClick={submit}
        disabled={checked === null && !complete}
      >
        {checked === null ? 'Vérifier' : 'Continuer'}
      </button>
    </div>
  );
}
