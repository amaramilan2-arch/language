import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_PARAMS,
  DEFAULT_QUEUE_OPTIONS,
  DEFAULT_SESSION_CONFIG,
  EXERCISE_SKILL,
  SessionQueue,
  planSession,
} from '@polyglotte/core';
import type {
  Capabilities,
  CardMemory,
  ContentItem,
  LanguageCode,
  SchedulerConfig,
  QueueProgress,
  SessionEntry,
} from '@polyglotte/core';
import { PACKS, defaultOrder, indexItems, unlockedDialogues } from '@polyglotte/content';
import { ExerciseHost, type AnswerResult } from '../exercises/index.js';
import { DialogueExercise } from '../exercises/DialogueExercise.js';
import { ProgressBar, Stat, formatDuration } from '../components/ui.js';
import {
  loadDialogueRecords,
  loadMemories,
  pendingNewItems,
  recordDialogue,
  recordReview,
  seenItemIds,
} from '../db/repository.js';
import { canSpeakLanguage, loadVoices } from '../speech/tts.js';
import { hasMicrophonePermission, isAsrSupported } from '../speech/asr.js';
import type { Settings } from '../db/database.js';
import type { Dialogue } from '@polyglotte/core';

interface SessionPageProps {
  language: LanguageCode;
  settings: Settings;
  onFinish: () => void;
}

interface SessionSummary {
  correct: number;
  total: number;
  newCards: number;
  durationMs: number;
  /** Renseigné si la session s'est close sur un dialogue. */
  dialogue?: { correct: number; total: number; title: string };
}

type Status = 'loading' | 'running' | 'dialogue' | 'done' | 'empty';

export function SessionPage({ language, settings, onFinish }: SessionPageProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [entry, setEntry] = useState<SessionEntry | null>(null);
  const [progress, setProgress] = useState<QueueProgress>({
    completed: 0,
    planned: 0,
    remaining: 0,
    correct: 0,
    incorrect: 0,
  });
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  /**
   * Dialogue proposé en clôture de session.
   *
   * Placé à la fin et non au milieu : un dialogue demande une attention
   * continue de plusieurs minutes, incompatible avec le rythme rapide des
   * cartes. En faire la récompense de fin de session lui donne sa place — et
   * donne une raison concrète d'aller au bout.
   */
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);

  const queueRef = useRef<SessionQueue | null>(null);
  const memoriesRef = useRef<Map<string, CardMemory>>(new Map());
  const startedAtRef = useRef(Date.now());
  const shownAtRef = useRef(Date.now());
  const newCardsRef = useRef(0);
  // La graine change à chaque présentation : sans cela, un mot raté puis
  // représenté afficherait exactement les mêmes distracteurs, et l'apprenant
  // retiendrait la position de la bonne réponse plutôt que le mot.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));

  const pack = PACKS[language];
  const items = useMemo(() => indexItems(pack), [pack]);
  const pool = useMemo(() => [...items.values()], [items]);

  const schedulerConfig: SchedulerConfig = useMemo(
    () => ({
      desiredRetention: settings.desiredRetention,
      params: DEFAULT_PARAMS,
      maximumIntervalDays: 1825,
    }),
    [settings.desiredRetention],
  );

  // --- Préparation de la session -------------------------------------------
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setStatus('loading');
      // Les voix doivent être chargées avant de planifier : c'est leur présence
      // qui détermine si les exercices d'écoute sont réalisables.
      await loadVoices();
      const micAllowed = await hasMicrophonePermission();

      const capabilities: Capabilities = {
        canPlayAudio: canSpeakLanguage(pack.profile),
        canRecognizeSpeech: isAsrSupported() && pack.profile.hasNativeAsr,
        hasMicrophone: micAllowed,
      };

      const [memories, pending, seen, dialogueRecords] = await Promise.all([
        loadMemories(language),
        pendingNewItems(language, defaultOrder(pack)),
        seenItemIds(language),
        loadDialogueRecords(language),
      ]);
      if (cancelled) return;

      // On privilégie un dialogue jamais fait ; à défaut, le plus ancien, pour
      // que la révision d'un échange déjà vu reste possible sans monopoliser.
      const available = unlockedDialogues(language, seen);
      const nextDialogue =
        available.find((d) => !dialogueRecords.has(d.id)) ??
        [...available].sort(
          (a, b) =>
            (dialogueRecords.get(a.id)?.lastSeenAt ?? 0) -
            (dialogueRecords.get(b.id)?.lastSeenAt ?? 0),
        )[0] ??
        null;
      setDialogue(nextDialogue);

      memoriesRef.current = memories;

      const plan = planSession({
        language,
        profile: pack.profile,
        items,
        memories,
        newItemOrder: pending,
        capabilities,
        config: {
          ...DEFAULT_SESSION_CONFIG,
          targetCards: settings.sessionLength,
          newCardLimit: settings.newCardsPerSession[language],
          skillWeights: Object.fromEntries(
            (['recognize', 'produce', 'listen', 'speak'] as const).map((skill) => [
              skill,
              settings.enabledSkills.includes(skill) ? DEFAULT_SESSION_CONFIG.skillWeights[skill] : 0,
            ]),
          ) as typeof DEFAULT_SESSION_CONFIG.skillWeights,
        },
        now: Date.now(),
      });

      // On retire les compétences désactivées dans les réglages : c'est ce qui
      // permet de réviser dans un train sans parler à voix haute.
      const filtered = {
        ...plan,
        entries: plan.entries.filter((item) => settings.enabledSkills.includes(item.skill)),
      };

      if (filtered.entries.length === 0) {
        setStatus('empty');
        return;
      }

      queueRef.current = new SessionQueue(filtered, DEFAULT_QUEUE_OPTIONS);
      startedAtRef.current = Date.now();
      shownAtRef.current = Date.now();
      newCardsRef.current = 0;
      setEntry(queueRef.current.peek());
      setProgress(queueRef.current.progress);
      setStatus('running');
    })();

    return () => {
      cancelled = true;
    };
  }, [language, pack, items, settings]);

  // --- Réponse à un exercice ------------------------------------------------
  const handleAnswer = useCallback(
    async (result: AnswerResult) => {
      const queue = queueRef.current;
      const current = queue?.peek();
      if (!queue || !current) return;

      const now = Date.now();
      const elapsedMs = now - shownAtRef.current;

      const outcome = await recordReview({
        itemId: current.itemId,
        skill: current.skill,
        language,
        rating: result.rating,
        exercise: current.exercise,
        elapsedMs,
        now,
        config: schedulerConfig,
      });

      memoriesRef.current.set(outcome.memory.id, outcome.memory);
      if (outcome.wasNew) newCardsRef.current += 1;

      queue.submit(result.rating, {
        memory: outcome.memory,
        item: items.get(current.itemId),
        capabilities: {
          canPlayAudio: canSpeakLanguage(pack.profile),
          canRecognizeSpeech: isAsrSupported() && pack.profile.hasNativeAsr,
          hasMicrophone: true,
        },
      });

      const next = queue.peek();
      setProgress(queue.progress);
      shownAtRef.current = Date.now();
      setSeed(Math.floor(Math.random() * 1e9));

      if (!next) {
        const stats = queue.progress;
        setSummary({
          correct: stats.correct,
          total: stats.correct + stats.incorrect,
          newCards: newCardsRef.current,
          durationMs: Date.now() - startedAtRef.current,
        });
        setEntry(null);
        // Les cartes sont finies : place au dialogue s'il y en a un de débloqué.
        setStatus(dialogue ? 'dialogue' : 'done');
        return;
      }
      setEntry(next);
    },
    [dialogue, items, language, pack.profile, schedulerConfig],
  );

  // --- Rendu ----------------------------------------------------------------

  if (status === 'loading') {
    return (
      <div className="page">
        <p className="muted center">Préparation de la session…</p>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__icon">✅</div>
          <h2>Rien à réviser pour l’instant</h2>
          <p className="muted">
            Toutes vos cartes sont à jour. Revenez plus tard, ou augmentez le nombre de nouveaux
            éléments par session dans les réglages.
          </p>
        </div>
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={onFinish}>
          Retour à l’accueil
        </button>
      </div>
    );
  }

  if (status === 'dialogue' && dialogue) {
    return (
      <div className="page">
        <DialogueExercise
          dialogue={dialogue}
          profile={pack.profile}
          settings={settings}
          onFinish={(result) => {
            void recordDialogue(
              dialogue.id,
              language,
              result.correct,
              result.total,
              Date.now(),
            );
            setSummary((current) =>
              current ? { ...current, dialogue: { ...result, title: dialogue.title } } : current,
            );
            setStatus('done');
          }}
        />
      </div>
    );
  }

  if (status === 'done' && summary) {
    const accuracy = summary.total === 0 ? 0 : Math.round((summary.correct / summary.total) * 100);
    return (
      <div className="page">
        <div className="empty">
          <div className="empty__icon">🎉</div>
          <h2>Session terminée</h2>
        </div>
        <div className="stats-grid">
          <Stat value={`${accuracy} %`} label="de réussite" />
          <Stat value={summary.total} label="exercices" />
          <Stat value={summary.newCards} label="nouveaux éléments" />
          <Stat value={formatDuration(summary.durationMs)} label="de pratique" />
        </div>
        {summary.dialogue ? (
          <div className="card stack stack--tight">
            <div className="row row--between">
              <strong>Dialogue : {summary.dialogue.title}</strong>
              <span className="badge badge--accent">
                {summary.dialogue.correct}/{summary.dialogue.total}
              </span>
            </div>
            <p className="muted">
              Comprendre un échange complet est la compétence la plus proche d’une conversation
              réelle — et celle qui progresse le plus lentement. Chaque dialogue compte.
            </p>
          </div>
        ) : null}
        <p className="muted center">
          {accuracy >= 85
            ? 'Excellent. Les intervalles s’allongent : vous en verrez moins demain, et c’est le signe que ça tient.'
            : accuracy >= 60
              ? 'Bon rythme. Les éléments manqués reviendront rapidement, c’est exactement ce qu’il faut.'
              : 'Session difficile. C’est normal sur du contenu récent — la répétition espacée est faite pour ça.'}
        </p>
        <button type="button" className="btn btn--primary btn--block btn--lg" onClick={onFinish}>
          Terminer
        </button>
      </div>
    );
  }

  if (!entry) return null;

  const item = items.get(entry.itemId);
  if (!item) return null;

  const total = Math.max(progress.planned, progress.completed + progress.remaining);

  return (
    <div className="page">
      <div className="row row--between">
        <button type="button" className="btn btn--ghost" onClick={onFinish} aria-label="Quitter la session">
          ✕
        </button>
        <span className="muted">
          {progress.completed} / {total}
        </span>
      </div>

      <ProgressBar value={progress.completed} max={total} />

      <ExerciseHost
        key={`${entry.cardId}-${seed}`}
        kind={entry.exercise}
        item={item as ContentItem}
        pool={pool}
        profile={pack.profile}
        skill={entry.skill ?? EXERCISE_SKILL[entry.exercise]}
        settings={settings}
        seed={seed}
        isFirstEncounter={entry.isFirstEncounter}
        memory={memoriesRef.current.get(entry.cardId)}
        onAnswer={(result) => void handleAnswer(result)}
      />
    </div>
  );
}
