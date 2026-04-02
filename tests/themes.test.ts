import { describe, expect, it } from 'vitest';
import { THEMES, getThemeById } from '../src/lib/themes';

describe('theme presets', () => {
  it('loads gradients from the JSON source', () => {
    expect(THEMES.length).toBeGreaterThan(6);
    expect(THEMES.slice(0, 6).map((theme) => theme.name)).toEqual([
      'Omolon',
      'Farhan',
      'Purple',
      'Ibtesam',
      'Radioactive Heat',
      'The Sky And The Sea'
    ]);
  });

  it('creates stable ids from gradient names', () => {
    expect(getThemeById('radioactive-heat').name).toBe('Radioactive Heat');
    expect(getThemeById('the-sky-and-the-sea').name).toBe('The Sky And The Sea');
  });
});
