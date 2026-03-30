import { ACCENTS, THEMES } from './themes';
import type { ClerraSettings } from './types';

export const DEFAULT_SETTINGS: ClerraSettings = {
  geminiApiKey: '',
  themeId: THEMES[0].id,
  accentId: ACCENTS[0].id,
  nightMode: false,
  playlistUrl: 'https://www.youtube.com/playlist?list=PLDisKgcnAC4Q2r6o-2Zf6amO5Ma9wJl3v',
  musicEnabled: true
};

export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as Array<keyof ClerraSettings>;

export function normalizeSettings(raw: Partial<ClerraSettings> | Record<string, unknown>): ClerraSettings {
  const source = raw as Partial<ClerraSettings>;
  const themeId = THEMES.some((theme) => theme.id === source.themeId) ? source.themeId ?? DEFAULT_SETTINGS.themeId : DEFAULT_SETTINGS.themeId;
  const accentId = ACCENTS.some((accent) => accent.id === source.accentId) ? source.accentId ?? DEFAULT_SETTINGS.accentId : DEFAULT_SETTINGS.accentId;
  const playlistUrl = typeof source.playlistUrl === 'string' && source.playlistUrl.trim().length > 0 ? source.playlistUrl.trim() : DEFAULT_SETTINGS.playlistUrl;

  return {
    geminiApiKey: typeof source.geminiApiKey === 'string' ? source.geminiApiKey.trim() : DEFAULT_SETTINGS.geminiApiKey,
    themeId,
    accentId,
    nightMode: typeof source.nightMode === 'boolean' ? source.nightMode : DEFAULT_SETTINGS.nightMode,
    playlistUrl,
    musicEnabled: typeof source.musicEnabled === 'boolean' ? source.musicEnabled : DEFAULT_SETTINGS.musicEnabled
  };
}

export async function loadSettings(): Promise<ClerraSettings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEYS);
  return normalizeSettings(stored);
}

export async function saveSettings(settings: Partial<ClerraSettings>): Promise<ClerraSettings> {
  const nextSettings = normalizeSettings({ ...(await loadSettings()), ...settings });
  await chrome.storage.local.set(nextSettings);
  return nextSettings;
}
