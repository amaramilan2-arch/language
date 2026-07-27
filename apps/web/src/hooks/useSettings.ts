import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '../db/database.js';

/**
 * Réglages courants, persistés dans IndexedDB.
 *
 * L'état initial est celui par défaut, remplacé dès la lecture de la base. Cela
 * évite un écran vide au démarrage : l'application est utilisable avant même que
 * le stockage ait répondu, ce qui compte sur un téléphone d'entrée de gamme.
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadSettings().then((stored) => {
      if (cancelled) return;
      setSettings(stored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    // Application optimiste : l'interface réagit immédiatement, l'écriture suit.
    // Un interrupteur qui met 40 ms à basculer donne l'impression d'une panne.
    setSettings((current) => ({ ...current, ...patch }));
    const next = await saveSettings(patch);
    setSettings(next);
    return next;
  }, []);

  return { settings, update, loaded };
}
