import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/lib/settings';

describe('settings normalization', () => {
  it('falls back to defaults for invalid theme and accent ids', () => {
    const normalized = normalizeSettings({ themeId: 'missing', accentId: 'unknown' });

    expect(normalized.themeId).toBe(DEFAULT_SETTINGS.themeId);
    expect(normalized.accentId).toBe(DEFAULT_SETTINGS.accentId);
  });

  it('trims string values and preserves booleans', () => {
    const normalized = normalizeSettings({
      geminiApiKey: '  key  ',
      playlistUrl: '  https://example.com/list  ',
      nightMode: true,
      musicEnabled: false
    });

    expect(normalized.geminiApiKey).toBe('key');
    expect(normalized.playlistUrl).toBe('https://example.com/list');
    expect(normalized.nightMode).toBe(true);
    expect(normalized.musicEnabled).toBe(false);
  });
});
