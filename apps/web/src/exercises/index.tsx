import type { CardMemory, ExerciseKind } from '@polyglotte/core';
import { BuildSentence } from './BuildSentence.js';
import { Flashcard } from './Flashcard.js';
import { MultipleChoice } from './MultipleChoice.js';
import { SpeakRepeat } from './SpeakRepeat.js';
import { TypeAnswer } from './TypeAnswer.js';
import type { ExerciseProps } from './types.js';

export * from './types.js';

interface ExerciseHostProps extends ExerciseProps {
  kind: ExerciseKind;
  memory?: CardMemory | undefined;
}

/**
 * Aiguille vers le composant d'exercice correspondant.
 *
 * Point d'entrée unique de tous les formats. `matchPairs` n'est pas encore
 * implémenté et retombe sur le choix multiple : mieux vaut un exercice
 * pertinent qu'un écran vide, et le planificateur ne le produit de toute façon
 * pas encore.
 */
export function ExerciseHost({ kind, memory, ...props }: ExerciseHostProps) {
  switch (kind) {
    case 'flashcard':
      return <Flashcard {...props} memory={memory} />;
    case 'multipleChoice':
      // Le choix multiple sert aussi bien à reconnaître (cible → français) qu'à
      // produire (français → cible) : c'est la compétence planifiée qui tranche.
      return <MultipleChoice {...props} mode={props.skill === 'produce' ? 'produce' : 'recognize'} />;
    case 'listenChoice':
      return <MultipleChoice {...props} mode="listen" />;
    case 'typeAnswer':
      return <TypeAnswer {...props} mode="produce" />;
    case 'dictation':
      return <TypeAnswer {...props} mode="dictation" />;
    case 'buildSentence':
      return <BuildSentence {...props} />;
    case 'speakRepeat':
      return <SpeakRepeat {...props} />;
    case 'matchPairs':
      return <MultipleChoice {...props} mode="recognize" />;
    case 'dialogue':
      // Un dialogue ne porte pas sur un élément isolé : il constitue une étape
      // à part de la session, rendue par `DialogueExercise` en amont de cet
      // aiguillage. Le planificateur d'éléments ne produit donc jamais ce cas ;
      // il n'existe ici que pour rester exhaustif et pour la journalisation.
      return <Flashcard {...props} memory={memory} />;
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return <Flashcard {...props} memory={memory} />;
    }
  }
}
