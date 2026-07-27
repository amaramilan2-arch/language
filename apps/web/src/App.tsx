import { useEffect, useState } from 'react';
import type { LanguageCode } from '@polyglotte/core';
import { useSettings } from './hooks/useSettings.js';
import { HomePage } from './pages/HomePage.js';
import { LessonsPage } from './pages/LessonsPage.js';
import { ProgressPage } from './pages/ProgressPage.js';
import { SessionPage } from './pages/SessionPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { loadVoices } from './speech/tts.js';

type Tab = 'home' | 'lessons' | 'progress' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Accueil', icon: '🏠' },
  { id: 'lessons', label: 'Contenu', icon: '📚' },
  { id: 'progress', label: 'Progrès', icon: '📊' },
  { id: 'settings', label: 'Réglages', icon: '⚙️' },
];

/**
 * Coquille de l'application.
 *
 * Navigation par onglets, sans routeur. Quatre écrans et une session modale ne
 * justifient pas une dépendance de routage supplémentaire — et une session en
 * cours ne doit surtout pas être interruptible par un bouton « précédent »
 * malencontreux, ce qui plaide contre les URL.
 */
export function App() {
  const { settings, update, loaded } = useSettings();
  const [tab, setTab] = useState<Tab>('home');
  const [sessionLanguage, setSessionLanguage] = useState<LanguageCode | null>(null);
  // Force le remontage des pages après une session, pour que les compteurs
  // reflètent immédiatement ce qui vient d'être révisé.
  const [refreshKey, setRefreshKey] = useState(0);

  // Le chargement des voix est lancé au démarrage : Chrome peuple sa liste de
  // façon asynchrone, et l'obtenir plus tard ferait manquer le premier audio.
  useEffect(() => {
    void loadVoices();
  }, []);

  if (!loaded) {
    return (
      <div className="app">
        <div className="page">
          <p className="muted center">Chargement…</p>
        </div>
      </div>
    );
  }

  if (sessionLanguage) {
    return (
      <div className="app" style={{ paddingBottom: 0 }}>
        <SessionPage
          language={sessionLanguage}
          settings={settings}
          onFinish={() => {
            setSessionLanguage(null);
            setRefreshKey((key) => key + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="app">
      {tab === 'home' ? (
        <HomePage
          key={refreshKey}
          settings={settings}
          onSelectLanguage={(language) => void update({ activeLanguage: language })}
          onStartSession={setSessionLanguage}
        />
      ) : null}

      {tab === 'lessons' ? (
        <LessonsPage key={refreshKey} language={settings.activeLanguage} settings={settings} />
      ) : null}

      {tab === 'progress' ? <ProgressPage key={refreshKey} language={settings.activeLanguage} /> : null}

      {tab === 'settings' ? (
        <SettingsPage settings={settings} language={settings.activeLanguage} onUpdate={update} />
      ) : null}

      <nav className="nav" aria-label="Navigation principale">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="nav__item"
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => setTab(item.id)}
          >
            <span className="nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
