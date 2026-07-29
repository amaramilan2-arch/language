import { useEffect, useState } from 'react';
import { computeStreak } from '@polyglotte/core';
import type { LanguageCode } from '@polyglotte/core';
import { PACKS, PACK_ORDER, countItems } from '@polyglotte/content';
import { Badge, Stat } from '../components/ui.js';
import { countDue, countSeen, loadActiveDays, newCardsToday } from '../db/repository.js';
import type { Settings } from '../db/database.js';

interface HomePageProps {
  settings: Settings;
  onSelectLanguage: (language: LanguageCode) => void;
  onStartSession: (language: LanguageCode) => void;
}

interface LanguageStatus {
  due: number;
  seen: number;
  total: number;
  newToday: number;
}

/**
 * Écran d'accueil : quoi faire, maintenant.
 *
 * Le seul chiffre qui compte au quotidien est le nombre de cartes dues. Il est
 * donc le plus visible, et c'est lui qui porte le bouton d'action. La série de
 * jours vient ensuite — elle motive, mais elle ne dit pas quoi faire.
 */
export function HomePage({ settings, onSelectLanguage, onStartSession }: HomePageProps) {
  const [status, setStatus] = useState<Record<string, LanguageStatus>>({});
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const now = Date.now();
      const entries = await Promise.all(
        PACK_ORDER.map(async (language) => {
          const [due, seen, newToday] = await Promise.all([
            countDue(language, now),
            countSeen(language),
            newCardsToday(language, now),
          ]);
          return [language, { due, seen, total: countItems(PACKS[language]), newToday }] as const;
        }),
      );
      const days = await loadActiveDays();
      if (cancelled) return;
      setStatus(Object.fromEntries(entries));
      setStreak(computeStreak(days, now));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const active = settings.activeLanguage;
  const activeStatus = status[active];
  const activePack = PACKS[active];
  const totalDue = PACK_ORDER.reduce((sum, code) => sum + (status[code]?.due ?? 0), 0);

  return (
    <div className="page">
      <div className="row row--between">
        <h1>Polyglotte</h1>
        {streak > 0 ? <Badge tone="warning">🔥 {streak} jour{streak > 1 ? 's' : ''}</Badge> : null}
      </div>

      <div className="stats-grid">
        <Stat value={totalDue} label="cartes à réviser" />
        <Stat value={streak} label={`jour${streak > 1 ? 's' : ''} d’affilée`} />
      </div>

      <div className="card card--hero stack">
        <div className="row row--between">
          <div className="row">
            <span style={{ fontSize: '2rem' }}>{activePack.profile.flag}</span>
            <div>
              <h2>{activePack.profile.name}</h2>
              <div className="muted">
                {activeStatus
                  ? `${activeStatus.seen} / ${activeStatus.total} éléments rencontrés`
                  : 'Chargement…'}
              </div>
            </div>
          </div>
          {activeStatus && activeStatus.due > 0 ? (
            <Badge tone="accent">{activeStatus.due} dues</Badge>
          ) : null}
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          onClick={() => onStartSession(active)}
        >
          {activeStatus && activeStatus.due > 0
            ? `Réviser ${Math.min(activeStatus.due, settings.sessionLength)} cartes`
            : 'Commencer une session'}
        </button>

        {activeStatus ? (
          <p className="muted center">
            {activeStatus.newToday > 0
              ? `${activeStatus.newToday} nouveau${activeStatus.newToday > 1 ? 'x' : ''} élément${
                  activeStatus.newToday > 1 ? 's' : ''
                } découvert${activeStatus.newToday > 1 ? 's' : ''} aujourd’hui`
              : 'Aucun nouvel élément découvert aujourd’hui'}
          </p>
        ) : null}
      </div>

      <div className="stack stack--tight">
        <h3>Changer de langue</h3>
        {PACK_ORDER.filter((code) => code !== active).map((code) => {
          const pack = PACKS[code];
          const info = status[code];
          return (
            <button
              key={code}
              type="button"
              className="card card--interactive"
              onClick={() => onSelectLanguage(code)}
            >
              <div className="row row--between">
                <div className="row">
                  <span style={{ fontSize: '1.5rem' }}>{pack.profile.flag}</span>
                  <div>
                    <div style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
                      {pack.profile.name}
                    </div>
                    <div className="muted">
                      {info ? `${info.seen} / ${info.total} éléments` : '—'}
                    </div>
                  </div>
                </div>
                {info && info.due > 0 ? <Badge tone="accent">{info.due}</Badge> : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
