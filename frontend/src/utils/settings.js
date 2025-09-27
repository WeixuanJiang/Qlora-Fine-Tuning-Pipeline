const STORAGE_KEY = 'qlora-user-settings';
export const SETTINGS_EVENT = 'qlora-settings-changed';

const defaultSettings = {
  huggingfaceToken: '',
  openaiApiKey: ''
};

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function loadSettings() {
  if (!isBrowser()) {
    return { ...defaultSettings };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultSettings };
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed
    };
  } catch (err) {
    console.warn('Failed to load settings from storage', err);
    return { ...defaultSettings };
  }
}

export function saveSettings(partialSettings) {
  if (!isBrowser()) {
    return { ...defaultSettings, ...partialSettings };
  }

  const current = loadSettings();
  const next = {
    ...current,
    ...partialSettings
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    const event = new CustomEvent(SETTINGS_EVENT, { detail: next });
    window.dispatchEvent(event);
  } catch (err) {
    console.error('Failed to save settings', err);
  }

  return next;
}

export function clearSettings() {
  if (!isBrowser()) {
    return { ...defaultSettings };
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    const event = new CustomEvent(SETTINGS_EVENT, { detail: { ...defaultSettings } });
    window.dispatchEvent(event);
  } catch (err) {
    console.error('Failed to clear settings', err);
  }

  return { ...defaultSettings };
}

export function hasSettingsStored() {
  const settings = loadSettings();
  return Boolean(settings.huggingfaceToken || settings.openaiApiKey);
}

export { defaultSettings };
