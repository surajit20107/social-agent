import { useState, useEffect, useCallback } from 'react';
import type { Settings } from '../types';
import { getSettings, saveSettings } from '../lib/storage';

const DEFAULT_SETTINGS: Settings = {
  openRouterApiKey: '',
  openRouterModel: 'openai/gpt-4o-mini',
  customModel: '',
  zenrioApiKey: '',
  supermemoryApiKey: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => getSettings() || DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = getSettings();
    if (stored) {
      setSettings(stored);
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const isConfigured = settings.openRouterApiKey.length > 0 && settings.zenrioApiKey.length > 0;

  return { settings, updateSettings, updateSetting, isConfigured, isLoaded };
}