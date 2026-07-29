import { useEffect, useState } from 'react';
import type { LanguageCode, Lesson, Unit } from '@polyglotte/core';
import { PACKS } from '@polyglotte/content';
import { AudioButton } from '../components/AudioButton.js';
import { ItemTarget } from '../components/TargetText.js';
import { Badge } from '../components/ui.js';
import { loadMemories } from '../db/repository.js';
import type { Settings } from '../db/database.js';

/**
 * Parcours du contenu, unité par unité.
 *
 * Sert à deux choses. Consulter ce qu'on a appris sans passer par un exercice —
 * la révision libre, celle qu'on fait cinq minutes avant d'entrer dans un café.
 * Et voir ce qui reste devant soi : une application où le contenu est invisible
 * donne l'impression d'un tapis roulant sans fin, ce qui décourage.
 */
export function LessonsPage({ language, settings }: { language: LanguageCode; settings: Settings }) {
  const [seenItems, setSeenItems] = useState<Set<string>>(new Set());
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  const pack = PACKS[language];

  useEffect(() => {
    let cancelled = false;
    void loadMemories(language).then((memories) => {
      if (cancelled) return;
      setSeenItems(
        new Set(
          [...memories.values()].filter((memory) => memory.state !== 'new').map((m) => m.itemId),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div className="page">
      <div className="row row--between">
        <h1>{pack.profile.name}</h1>
        <span style={{ fontSize: '1.6rem' }}>{pack.profile.flag}</span>
      </div>

      {pack.units.map((unit) => (
        <UnitCard
          key={unit.id}
          unit={unit}
          seenItems={seenItems}
          open={openUnit === unit.id}
          onToggle={() => setOpenUnit(openUnit === unit.id ? null : unit.id)}
          language={language}
          settings={settings}
        />
      ))}
    </div>
  );
}

function UnitCard({
  unit,
  seenItems,
  open,
  onToggle,
  language,
  settings,
}: {
  unit: Unit;
  seenItems: Set<string>;
  open: boolean;
  onToggle: () => void;
  language: LanguageCode;
  settings: Settings;
}) {
  const allItems = unit.lessons.flatMap((lesson) => lesson.items);
  const seen = allItems.filter((item) => seenItems.has(item.id)).length;
  const percent = allItems.length === 0 ? 0 : Math.round((seen / allItems.length) * 100);

  return (
    <div className="card stack stack--tight">
      <button type="button" className="row row--between" onClick={onToggle} aria-expanded={open}>
        <div className="row">
          <span style={{ fontSize: '1.5rem' }}>{unit.icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{unit.title}</div>
            <div className="muted">{unit.description}</div>
          </div>
        </div>
        <Badge tone={percent === 100 ? 'success' : percent > 0 ? 'accent' : 'default'}>
          {percent} %
        </Badge>
      </button>

      <div className="progress">
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>

      {open
        ? unit.lessons.map((lesson) => (
            <LessonBlock
              key={lesson.id}
              lesson={lesson}
              seenItems={seenItems}
              language={language}
              settings={settings}
            />
          ))
        : null}
    </div>
  );
}

function LessonBlock({
  lesson,
  seenItems,
  language,
  settings,
}: {
  lesson: Lesson;
  seenItems: Set<string>;
  language: LanguageCode;
  settings: Settings;
}) {
  const profile = PACKS[language].profile;

  return (
    <div className="stack stack--tight" style={{ marginTop: 12 }}>
      <div className="row row--between">
        <h3>{lesson.title}</h3>
        <Badge>{lesson.level}</Badge>
      </div>
      <p className="muted">{lesson.goal}</p>

      {lesson.items.map((item) => (
        <div
          key={item.id}
          className="row row--between"
          style={{
            padding: '10px 0',
            borderTop: '1px solid var(--border)',
            opacity: seenItems.has(item.id) ? 1 : 0.55,
          }}
        >
          <div className="grow">
            <ItemTarget
              item={item}
              profile={profile}
              showTransliteration={settings.showTransliteration}
              size="sm"
            />
            <div className="muted">{item.fr}</div>
            {item.note ? <div className="note" style={{ marginTop: 6 }}>{item.note}</div> : null}
          </div>
          {/* Jamais de lecture automatique ici : la page liste des dizaines
              d'éléments, qui se mettraient tous à parler en même temps. */}
          <AudioButton
            text={item.target}
            profile={profile}
            rate={settings.speechRate}
            size="sm"
            autoPlay={false}
          />
        </div>
      ))}
    </div>
  );
}
