import { useEffect, useMemo, useState } from 'react';
import { buildChoices, createRng } from '@polyglotte/core';
import type { ContentItem, Skill } from '@polyglotte/core';
import { AudioButton, VoiceWarning } from '../components/AudioButton.js';
import { ItemTarget, TargetText } from '../components/TargetText.js';
import { autoRating, type ExerciseProps } from './types.js';

interface MultipleChoiceProps extends ExerciseProps {
  /**
   * `recognize` : on montre la langue cible, on choisit le sens français.
   * `produce`   : on montre le français, on choisit la forme cible.
   * `listen`    : on entend la langue cible, on choisit le sens français.
   */
  mode: Skill;
}

const OPTION_COUNT = 4;
const KEYS = ['1', '2', '3', '4'];

/**
 * Choix multiple, décliné pour trois compétences.
 *
 * Sert de premier palier après la découverte : reconnaître une bonne réponse
 * parmi quatre est nettement plus facile que la produire de mémoire, et c'est
 * l'étape qui permet à un mot de s'installer avant qu'on exige davantage.
 *
 * La bonne réponse reste affichée après un échec, et l'exercice ne se referme
 * pas immédiatement : c'est le moment où l'apprentissage a réellement lieu.
 */
export function MultipleChoice({
  item,
  pool,
  profile,
  settings,
  seed,
  mode,
  onAnswer,
}: MultipleChoiceProps) {
  const [chosen, setChosen] = useState<number | null>(null);

  const { options, correctIndex } = useMemo(
    () => buildChoices(item, pool, mode === 'produce' ? 'produce' : 'recognize', OPTION_COUNT, createRng(seed)),
    [item, pool, mode, seed],
  );

  useEffect(() => setChosen(null), [item.id, seed]);

  const select = (index: number) => {
    if (chosen !== null) return;
    setChosen(index);
    const correct = index === correctIndex;
    // Deux secondes de lecture après une erreur, une demi-seconde après une
    // réussite. Enchaîner immédiatement sur l'exercice suivant ferait perdre
    // toute la valeur pédagogique de la correction.
    window.setTimeout(() => onAnswer({ rating: autoRating(correct, false), correct }), correct ? 550 : 1900);
  };

  // Raccourcis clavier : sur ordinateur, répondre au clavier double la vitesse
  // d'une session, et c'est ce qui rend une révision quotidienne tenable.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const index = KEYS.indexOf(event.key);
      if (index >= 0 && index < options.length) select(index);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const optionLabel = (option: ContentItem) => (mode === 'produce' ? option.target : option.fr);

  return (
    <div className="exercise">
      <p className="muted center">
        {mode === 'listen'
          ? 'Écoutez, puis choisissez la traduction'
          : mode === 'produce'
            ? 'Choisissez la traduction correcte'
            : 'Que signifie ce mot ?'}
      </p>

      <div className="prompt">
        {mode === 'listen' ? (
          <>
            <AudioButton
              text={item.target}
              profile={profile}
              rate={settings.speechRate}
              autoPlay={settings.autoPlayAudio}
            />
            {/* Le texte reste caché tant qu'on n'a pas répondu : sinon
                l'exercice teste la lecture, pas l'écoute. */}
            {chosen !== null ? (
              <ItemTarget
                item={item}
                profile={profile}
                showTransliteration={settings.showTransliteration}
                size="sm"
              />
            ) : null}
            <VoiceWarning profile={profile} />
          </>
        ) : mode === 'produce' ? (
          <div className="target">{item.fr}</div>
        ) : (
          <>
            <ItemTarget item={item} profile={profile} showTransliteration={settings.showTransliteration} />
            <AudioButton
              text={item.target}
              profile={profile}
              rate={settings.speechRate}
              size="sm"
              autoPlay={false}
            />
          </>
        )}
      </div>

      <div className="choices">
        {options.map((option, index) => {
          const isCorrect = index === correctIndex;
          const isChosen = index === chosen;
          const className = [
            'choice',
            chosen !== null && isCorrect ? 'choice--correct' : '',
            isChosen && !isCorrect ? 'choice--wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={option.id}
              type="button"
              className={className}
              onClick={() => select(index)}
              disabled={chosen !== null}
            >
              <span className="choice__key">{KEYS[index]}</span>
              {mode === 'produce' ? (
                <TargetText
                  text={optionLabel(option)}
                  profile={profile}
                  translit={option.translit}
                  showTransliteration={settings.showTransliteration}
                  size="sm"
                />
              ) : (
                <span>{optionLabel(option)}</span>
              )}
            </button>
          );
        })}
      </div>

      {chosen !== null && chosen !== correctIndex && item.note ? (
        <div className="note">{item.note}</div>
      ) : null}
    </div>
  );
}
