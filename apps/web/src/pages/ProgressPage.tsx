import { useEffect, useState } from 'react';
import { SKILL_LABELS, computeStreak, forecast, masteryBySkill, retentionStats } from '@polyglotte/core';
import type { CardMemory, ForecastDay, LanguageCode, ReviewLog, SkillMastery } from '@polyglotte/core';
import { PACKS, countItems } from '@polyglotte/content';
import { Stat, formatDuration } from '../components/ui.js';
import { loadActiveDays, loadDayRecords, loadLogs, loadMemories } from '../db/repository.js';
import type { DayRecord } from '../db/database.js';

/**
 * Écran de progression.
 *
 * Le choix des indicateurs est délibéré. Un compteur de « mots vus » ne fait que
 * monter, même quand on oublie tout : il rassure à tort. Ceux retenus ici
 * mesurent la mémoire réelle et la charge à venir, c'est-à-dire ce qui permet de
 * décider s'il faut lever ou baisser le rythme.
 */
export function ProgressPage({ language }: { language: LanguageCode }) {
  const [memories, setMemories] = useState<CardMemory[]>([]);
  const [days, setDays] = useState<DayRecord[]>([]);
  const [logs, setLogs] = useState<ReviewLog[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const [memoryMap, dayRecords, reviewLogs, activeDays] = await Promise.all([
        loadMemories(language),
        loadDayRecords(language),
        loadLogs(language),
        loadActiveDays(),
      ]);
      if (cancelled) return;
      setMemories([...memoryMap.values()]);
      setDays(dayRecords);
      setLogs(reviewLogs);
      setStreak(computeStreak(activeDays, Date.now()));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const now = Date.now();
  const pack = PACKS[language];
  const mastery = masteryBySkill(memories, language, now);
  const upcoming = forecast(memories, language, now, 14);
  const retention = retentionStats(logs, now - 30 * 86_400_000);

  const seenItems = new Set(memories.filter((m) => m.state !== 'new').map((m) => m.itemId)).size;
  const totalItems = countItems(pack);
  const totalTime = days.reduce((sum, day) => sum + day.timeMs, 0);
  const totalReviews = days.reduce((sum, day) => sum + day.reviews, 0);

  if (loading) {
    return (
      <div className="page">
        <p className="muted center">Chargement…</p>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="page">
        <h1>Progression</h1>
        <div className="empty">
          <div className="empty__icon">📊</div>
          <h2>Rien à afficher pour l’instant</h2>
          <p className="muted">
            Terminez une première session en {pack.profile.name.toLowerCase()} et vos statistiques
            apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row row--between">
        <h1>Progression</h1>
        <span style={{ fontSize: '1.6rem' }}>{pack.profile.flag}</span>
      </div>

      <div className="stats-grid">
        <Stat value={`${seenItems} / ${totalItems}`} label="éléments rencontrés" />
        <Stat value={streak} label={`jour${streak > 1 ? 's' : ''} d’affilée`} />
        <Stat value={totalReviews} label="révisions au total" />
        <Stat value={formatDuration(totalTime)} label="de pratique cumulée" />
      </div>

      <MasterySection mastery={mastery} />
      <ForecastSection days={upcoming} />

      <div className="card stack stack--tight">
        <h3>Rétention mesurée</h3>
        {retention.reviews < 20 ? (
          <p className="muted">
            Encore trop peu de révisions ({retention.reviews}) pour un chiffre fiable. Il en faut une
            vingtaine sur des cartes déjà connues.
          </p>
        ) : (
          <>
            <div className="row row--between">
              <span className="stat__value">{Math.round(retention.retention * 100)} %</span>
              <span className="muted">sur 30 jours, {retention.reviews} révisions</span>
            </div>
            <p className="muted">
              {retention.retention >= 0.85
                ? 'Conforme à la cible de 90 %. Le rythme de révision est bien calibré.'
                : 'En dessous de la cible de 90 %. Réduisez le nombre de nouveaux éléments par session : l’oubli vient presque toujours d’un apport trop rapide.'}
            </p>
            <p className="muted">
              Temps de réponse médian : {Math.round(retention.medianResponseMs / 100) / 10} s
            </p>
          </>
        )}
      </div>

      <ActivitySection days={days} />
    </div>
  );
}

function MasterySection({ mastery }: { mastery: SkillMastery[] }) {
  return (
    <div className="card stack stack--tight">
      <h3>Maîtrise par compétence</h3>
      <p className="muted">
        Une carte est « solide » quand elle tient une semaine sans révision, « acquise » quand elle
        tient un mois.
      </p>
      {mastery.map((skill) => {
        const total = skill.learning + skill.solid + skill.mastered;
        return (
          <div key={skill.skill} className="skill-row" style={{ marginTop: 10 }}>
            <div className="row row--between">
              <span>{SKILL_LABELS[skill.skill]}</span>
              <span className="muted">
                {total === 0 ? 'non commencé' : `${skill.mastered} acquises / ${total}`}
              </span>
            </div>
            <div className="skill-bar">
              {total > 0 ? (
                <>
                  <div
                    className="skill-bar__seg--mastered"
                    style={{ width: `${(skill.mastered / total) * 100}%` }}
                  />
                  <div
                    className="skill-bar__seg--solid"
                    style={{ width: `${(skill.solid / total) * 100}%` }}
                  />
                  <div
                    className="skill-bar__seg--learning"
                    style={{ width: `${(skill.learning / total) * 100}%` }}
                  />
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ForecastSection({ days }: { days: ForecastDay[] }) {
  const max = Math.max(1, ...days.map((day) => day.count));
  const peak = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]!);

  return (
    <div className="card stack stack--tight">
      <h3>Charge des 14 prochains jours</h3>
      <p className="muted">
        L’indicateur à surveiller. Un pic annoncé se corrige en réduisant les nouveaux éléments dès
        maintenant — une fois dedans, il est trop tard.
      </p>
      <div className="bars" aria-hidden="true">
        {days.map((day) => (
          <div key={day.dayKey} className="bars__col" title={`${day.dayKey} : ${day.count}`}>
            <div
              className={`bars__bar ${day.offset === 0 ? 'bars__bar--today' : ''}`}
              style={{ height: `${(day.count / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <p className="muted">
        Maximum attendu : {peak.count} carte{peak.count > 1 ? 's' : ''}
        {peak.offset === 0 ? ' aujourd’hui' : ` dans ${peak.offset} jour${peak.offset > 1 ? 's' : ''}`}.
      </p>
    </div>
  );
}

function ActivitySection({ days }: { days: DayRecord[] }) {
  const recent = days.slice(-30);
  const max = Math.max(1, ...recent.map((day) => day.reviews));

  return (
    <div className="card stack stack--tight">
      <h3>Activité des 30 derniers jours</h3>
      {recent.length === 0 ? (
        <p className="muted">Aucune activité enregistrée.</p>
      ) : (
        <>
          <div className="bars" aria-hidden="true">
            {recent.map((day) => (
              <div key={day.key} className="bars__col" title={`${day.day} : ${day.reviews} révisions`}>
                <div className="bars__bar" style={{ height: `${(day.reviews / max) * 100}%` }} />
              </div>
            ))}
          </div>
          <p className="muted">
            {recent.length} jour{recent.length > 1 ? 's' : ''} d’activité, en moyenne{' '}
            {Math.round(recent.reduce((sum, day) => sum + day.reviews, 0) / recent.length)} révisions
            par jour actif.
          </p>
        </>
      )}
    </div>
  );
}
