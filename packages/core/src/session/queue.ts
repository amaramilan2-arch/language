/**
 * File d'exécution d'une session.
 *
 * Séparation volontaire d'avec FSRS : FSRS raisonne en jours, la file raisonne
 * en « dans combien d'exercices ». Une carte ratée ne doit pas revenir demain,
 * elle doit revenir dans quelques minutes, une fois quelques autres cartes
 * intercalées. Mélanger ces deux échelles de temps dans le même module est
 * l'erreur classique qui rend ce genre de code impossible à tester.
 */

import type { CardMemory, ContentItem, ExerciseKind, Rating } from '../types/index.js';
import { RATINGS } from '../types/index.js';
import type { Capabilities, SessionEntry, SessionPlan } from './planner.js';
import { pickExercise } from './planner.js';

export interface QueueOptions {
  /**
   * Nombre d'exercices à intercaler avant de remontrer une carte ratée.
   * Trop court, l'apprenant répond de mémoire immédiate sans rien encoder ;
   * trop long, il a le temps de tout réoublier.
   */
  relearnGap: number;
  /** Nombre maximum de réapparitions d'une même carte dans une session. */
  maxRetriesPerCard: number;
}

export const DEFAULT_QUEUE_OPTIONS: QueueOptions = {
  relearnGap: 4,
  maxRetriesPerCard: 3,
};

export interface QueueProgress {
  /** Exercices validés (note ≥ « correct »). */
  completed: number;
  /** Total prévu à l'ouverture de la session. */
  planned: number;
  /** Exercices restants dans la file, réapparitions comprises. */
  remaining: number;
  correct: number;
  incorrect: number;
}

/**
 * Fait tourner un plan de session en réinjectant les cartes ratées.
 *
 * L'objet est mutable et volontairement simple : c'est un curseur sur une liste,
 * pas une machine à états. Toute la complexité pédagogique est en amont, dans le
 * planificateur, et en aval, dans FSRS.
 */
export class SessionQueue {
  private readonly queue: SessionEntry[];
  private readonly retries = new Map<string, number>();
  private readonly plannedCount: number;
  private completedCount = 0;
  private correctCount = 0;
  private incorrectCount = 0;

  constructor(
    plan: SessionPlan,
    private readonly options: QueueOptions = DEFAULT_QUEUE_OPTIONS,
  ) {
    this.queue = [...plan.entries];
    this.plannedCount = plan.entries.length;
  }

  /** Entrée courante, ou `null` si la session est terminée. */
  peek(): SessionEntry | null {
    return this.queue[0] ?? null;
  }

  get isFinished(): boolean {
    return this.queue.length === 0;
  }

  get progress(): QueueProgress {
    return {
      completed: this.completedCount,
      planned: this.plannedCount,
      remaining: this.queue.length,
      correct: this.correctCount,
      incorrect: this.incorrectCount,
    };
  }

  /**
   * Enregistre la note de l'entrée courante et avance.
   *
   * Une carte ratée est réinsérée `relearnGap` positions plus loin, avec un
   * format d'exercice recalculé : si l'apprenant a échoué à écrire le mot, on le
   * lui repropose d'abord en reconnaissance. Redemander exactement le même
   * exercice qui vient d'échouer ne fait que répéter l'échec.
   */
  submit(
    rating: Rating,
    context?: { memory?: CardMemory; item?: ContentItem; capabilities?: Capabilities },
  ): void {
    const current = this.queue.shift();
    if (!current) return;

    if (rating === RATINGS.again) {
      this.incorrectCount += 1;
      const attempts = (this.retries.get(current.cardId) ?? 0) + 1;
      this.retries.set(current.cardId, attempts);

      if (attempts <= this.options.maxRetriesPerCard) {
        this.queue.splice(Math.min(this.options.relearnGap, this.queue.length), 0, {
          ...current,
          exercise: this.easierExercise(current, context),
          isFirstEncounter: false,
        });
        return;
      }
      // Trop d'échecs : on laisse tomber pour aujourd'hui. FSRS la ramènera.
      this.completedCount += 1;
      return;
    }

    this.correctCount += 1;
    this.completedCount += 1;
  }

  /** Abandonne la session en cours. */
  abort(): void {
    this.queue.length = 0;
  }

  /**
   * Reformule un exercice raté en une version plus accessible.
   * On redescend d'un cran sur l'échelle production → reconnaissance.
   */
  private easierExercise(
    entry: SessionEntry,
    context?: { memory?: CardMemory; item?: ContentItem; capabilities?: Capabilities },
  ): ExerciseKind {
    switch (entry.exercise) {
      case 'typeAnswer':
        return entry.skill === 'produce' ? 'buildSentence' : 'multipleChoice';
      case 'dictation':
        return 'listenChoice';
      case 'buildSentence':
        return 'multipleChoice';
      case 'multipleChoice':
        return 'flashcard';
      default:
        if (context?.item && context.capabilities) {
          return pickExercise(entry.skill, context.memory, context.item, context.capabilities);
        }
        return entry.exercise;
    }
  }
}
