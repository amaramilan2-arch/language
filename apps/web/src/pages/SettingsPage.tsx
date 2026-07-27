import { useRef, useState } from 'react';
import { SKILLS, SKILL_LABELS } from '@polyglotte/core';
import type { LanguageCode, Skill } from '@polyglotte/core';
import { PACKS, PACK_ORDER } from '@polyglotte/content';
import { Toggle } from '../components/ui.js';
import { exportBackup, importBackup, resetAll } from '../db/repository.js';
import type { Settings } from '../db/database.js';

interface SettingsPageProps {
  settings: Settings;
  language: LanguageCode;
  onUpdate: (patch: Partial<Settings>) => Promise<unknown>;
}

export function SettingsPage({ settings, language, onUpdate }: SettingsPageProps) {
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleSkill = (skill: Skill, enabled: boolean) => {
    const next = enabled
      ? [...new Set([...settings.enabledSkills, skill])]
      : settings.enabledSkills.filter((s) => s !== skill);
    // Tout désactiver produirait une session vide et l'air d'une panne.
    if (next.length === 0) {
      setMessage('Au moins une compétence doit rester active.');
      return;
    }
    void onUpdate({ enabledSkills: next });
  };

  const doExport = async () => {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `polyglotte-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage('Sauvegarde exportée.');
  };

  const doImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const { merged, skipped } = await importBackup(parsed);
      setMessage(`Import terminé : ${merged} cartes restaurées, ${skipped} déjà à jour.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fichier illisible.');
    }
  };

  const doReset = async () => {
    const confirmed = window.confirm(
      'Effacer définitivement toute votre progression ? Cette action est irréversible. Pensez à exporter une sauvegarde avant.',
    );
    if (!confirmed) return;
    await resetAll();
    setMessage('Progression effacée.');
  };

  return (
    <div className="page">
      <h1>Réglages</h1>

      {message ? <div className="feedback feedback--info">{message}</div> : null}

      <div className="card stack stack--tight">
        <h3>Rythme d’apprentissage</h3>
        <p className="muted">
          Les deux réglages qui décident si l’application tiendra dans la durée. Le réflexe est de
          les pousser au maximum le premier jour ; c’est exactement ainsi qu’on se construit un mur
          de révisions trois semaines plus tard.
        </p>

        <label className="stack stack--tight" style={{ marginTop: 12 }}>
          <div className="row row--between">
            <span>Nouveaux éléments par session</span>
            <strong>{settings.newCardsPerSession[language]}</strong>
          </div>
          <input
            className="slider"
            type="range"
            min={0}
            max={20}
            value={settings.newCardsPerSession[language]}
            onChange={(event) =>
              void onUpdate({
                newCardsPerSession: {
                  ...settings.newCardsPerSession,
                  [language]: Number(event.target.value),
                },
              })
            }
          />
          <span className="muted">
            En {PACKS[language].profile.name.toLowerCase()}. Chaque nouvel élément représente environ
            huit révisions sur l’année : à 15 par jour, comptez près de 120 cartes quotidiennes au
            régime de croisière.
          </span>
        </label>

        <label className="stack stack--tight" style={{ marginTop: 12 }}>
          <div className="row row--between">
            <span>Longueur d’une session</span>
            <strong>{settings.sessionLength} exercices</strong>
          </div>
          <input
            className="slider"
            type="range"
            min={5}
            max={60}
            step={5}
            value={settings.sessionLength}
            onChange={(event) => void onUpdate({ sessionLength: Number(event.target.value) })}
          />
        </label>

        <label className="stack stack--tight" style={{ marginTop: 12 }}>
          <div className="row row--between">
            <span>Rétention visée</span>
            <strong>{Math.round(settings.desiredRetention * 100)} %</strong>
          </div>
          <input
            className="slider"
            type="range"
            min={80}
            max={97}
            value={Math.round(settings.desiredRetention * 100)}
            onChange={(event) => void onUpdate({ desiredRetention: Number(event.target.value) / 100 })}
          />
          <span className="muted">
            Probabilité de vous souvenir d’une carte au moment où elle vous est représentée. Monter
            à 95 % double presque le nombre de révisions pour un gain modeste ; 90 % est le bon
            compromis.
          </span>
        </label>
      </div>

      <div className="card stack stack--tight">
        <h3>Compétences travaillées</h3>
        <p className="muted">
          Désactivez l’oral pour réviser dans un lieu public, puis réactivez-le. Les cartes
          concernées sont simplement mises en pause, jamais perdues.
        </p>
        {SKILLS.map((skill) => (
          <Toggle
            key={skill}
            label={SKILL_LABELS[skill]}
            checked={settings.enabledSkills.includes(skill)}
            onChange={(next) => toggleSkill(skill, next)}
          />
        ))}
      </div>

      <div className="card stack stack--tight">
        <h3>Audio et affichage</h3>
        <Toggle
          label="Lecture automatique"
          description="Prononce le mot dès l’affichage de la carte"
          checked={settings.autoPlayAudio}
          onChange={(next) => void onUpdate({ autoPlayAudio: next })}
        />
        <Toggle
          label="Afficher la translittération"
          description="Écriture latine sous l’arabe tunisien"
          checked={settings.showTransliteration}
          onChange={(next) => void onUpdate({ showTransliteration: next })}
        />
        <label className="stack stack--tight" style={{ marginTop: 12 }}>
          <div className="row row--between">
            <span>Vitesse de la voix</span>
            <strong>{settings.speechRate.toFixed(1).replace('.', ',')}×</strong>
          </div>
          <input
            className="slider"
            type="range"
            min={50}
            max={120}
            value={Math.round(settings.speechRate * 100)}
            onChange={(event) => void onUpdate({ speechRate: Number(event.target.value) / 100 })}
          />
        </label>
      </div>

      <div className="card stack stack--tight">
        <h3>Langue affichée au démarrage</h3>
        <div className="row row--wrap">
          {PACK_ORDER.map((code) => (
            <button
              key={code}
              type="button"
              className={`btn ${settings.activeLanguage === code ? 'btn--primary' : ''}`}
              onClick={() => void onUpdate({ activeLanguage: code })}
            >
              {PACKS[code].profile.flag} {PACKS[code].profile.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card stack stack--tight">
        <h3>Sauvegarde</h3>
        <p className="muted">
          Vos données ne quittent jamais cet appareil : aucun compte, aucun serveur. La contrepartie
          est qu’un nettoyage du navigateur les efface. Exportez régulièrement — c’est le seul filet
          de sécurité.
        </p>
        <button type="button" className="btn btn--block" onClick={() => void doExport()}>
          Exporter ma progression
        </button>
        <button type="button" className="btn btn--block" onClick={() => fileRef.current?.click()}>
          Importer une sauvegarde
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void doImport(file);
            event.target.value = '';
          }}
        />
        <button type="button" className="btn btn--danger btn--block" onClick={() => void doReset()}>
          Effacer toute ma progression
        </button>
      </div>

      <p className="muted center">Polyglotte — version 0.1.0</p>
    </div>
  );
}
