import { useEffect, useRef, useState } from 'react';
import { grade } from '@polyglotte/core';
import type { GradingResult } from '@polyglotte/core';
import { AudioButton, VoiceWarning } from '../components/AudioButton.js';
import { ItemTarget } from '../components/TargetText.js';
import { acceptedTarget, autoRating, type ExerciseProps } from './types.js';

interface TypeAnswerProps extends ExerciseProps {
  /**
   * `produce`  : le français est affiché, on écrit la forme cible.
   * `dictation`: on entend la forme cible, on l'écrit — sans jamais la voir.
   */
  mode: 'produce' | 'dictation';
}

/**
 * Saisie libre de la réponse.
 *
 * L'exercice le plus exigeant, et de loin le plus efficace : produire de mémoire
 * ancre bien plus solidement que reconnaître. C'est aussi celui où une
 * correction trop rigide fait le plus de dégâts, d'où le recours au correcteur
 * à trois verdicts de `@polyglotte/core` — un accent oublié ou une lettre
 * inversée sont signalés sans être comptés faux.
 */
export function TypeAnswer({ item, profile, settings, mode, onAnswer }: TypeAnswerProps) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<GradingResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue('');
    setResult(null);
    // Le clavier doit s'ouvrir seul : demander une tape supplémentaire à chaque
    // exercice, vingt fois par session, use la patience très vite.
    inputRef.current?.focus();
  }, [item.id]);

  const submit = () => {
    if (result !== null) {
      onAnswer({ rating: autoRating(result.accepted, result.verdict !== 'exact'), correct: result.accepted });
      return;
    }
    if (!value.trim()) return;
    // La dictée est corrigée en mode strict : la tolérance aux fautes de frappe
    // masquerait précisément ce que l'exercice cherche à mesurer, la précision
    // de l'écoute.
    setResult(grade(value, acceptedTarget(item), mode === 'dictation'));
  };

  const rtl = profile.direction === 'rtl';
  const inputClass = [
    'input',
    rtl ? 'input--rtl' : '',
    result === null ? '' : result.accepted ? 'input--correct' : 'input--wrong',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="exercise">
      <p className="muted center">
        {mode === 'dictation'
          ? `Écoutez et écrivez ce que vous entendez, en ${profile.name.toLowerCase()}`
          : `Écrivez cette expression en ${profile.name.toLowerCase()}`}
      </p>

      <div className="prompt">
        {mode === 'dictation' ? (
          <>
            <AudioButton
              text={item.target}
              profile={profile}
              rate={settings.speechRate}
              autoPlay={settings.autoPlayAudio}
            />
            <p className="muted">Vous pouvez réécouter autant de fois que nécessaire.</p>
            <VoiceWarning profile={profile} />
          </>
        ) : (
          <div className="target">{item.fr}</div>
        )}
      </div>

      <input
        ref={inputRef}
        className={inputClass}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') submit();
        }}
        placeholder={rtl ? 'اكتب هنا…' : 'Votre réponse…'}
        dir={rtl ? 'rtl' : 'ltr'}
        lang={profile.bcp47}
        readOnly={result !== null}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Votre réponse"
      />

      {result !== null ? (
        <div className={`feedback ${result.accepted ? 'feedback--correct' : 'feedback--wrong'}`}>
          <div className="row row--between">
            <strong>{result.accepted ? 'Correct' : 'Pas tout à fait'}</strong>
            {/* La réponse vient d'être révélée : on la prononce aussitôt, pour
                associer la forme écrite au son pendant qu'elle est sous les yeux. */}
            <AudioButton
              text={item.target}
              profile={profile}
              rate={settings.speechRate}
              size="sm"
              autoPlay={settings.autoPlayAudio}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <ItemTarget
              item={item}
              profile={profile}
              showTransliteration={settings.showTransliteration}
              size="sm"
            />
          </div>
          {result.hint ? <p className="muted">{result.hint}</p> : null}
          {item.note ? <p className="muted">{item.note}</p> : null}
        </div>
      ) : null}

      <button
        type="button"
        className="btn btn--primary btn--block btn--lg"
        onClick={submit}
        disabled={result === null && !value.trim()}
      >
        {result === null ? 'Valider' : 'Continuer'}
      </button>
    </div>
  );
}
