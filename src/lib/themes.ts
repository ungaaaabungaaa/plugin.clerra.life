export interface ThemePreset {
  id: string;
  name: string;
  gradient: string;
}

export interface AccentPreset {
  id: string;
  name: string;
  color: string;
}

export const THEMES: ThemePreset[] = [
  {
    id: 'aurora-haze',
    name: 'Aurora Haze',
    gradient: 'radial-gradient(circle at 62% 22%, rgb(128 233 92 / 0.88) 0%, rgb(88 181 114 / 0.58) 26%, rgb(28 68 87 / 0.82) 72%, #161739 100%)'
  },
  {
    id: 'sunset-drive',
    name: 'Sunset Drive',
    gradient: 'radial-gradient(circle at 24% 18%, rgb(255 210 91 / 0.88) 0%, rgb(246 121 85 / 0.62) 34%, rgb(134 64 117 / 0.84) 68%, #1a1832 100%)'
  }
];

export const ACCENTS: AccentPreset[] = [
  { id: 'blush', name: 'Blush', color: '#F79BB4' },
  { id: 'gold', name: 'Gold', color: '#FACC43' },
  { id: 'flare', name: 'Flare', color: '#F94632' },
  { id: 'jade', name: 'Jade', color: '#27C08E' },
  { id: 'ocean', name: 'Ocean', color: '#29A6D2' }
];

export function getThemeById(themeId: string): ThemePreset {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}

export function getAccentById(accentId: string): AccentPreset {
  return ACCENTS.find((accent) => accent.id === accentId) ?? ACCENTS[0];
}
