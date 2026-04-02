import gradientPresets from './gradients.json';

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

type GradientPreset = {
  name: string;
  colors: string[];
};

function slugifyThemeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildLinearGradient(colors: string[]): string {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

export const THEMES: ThemePreset[] = (gradientPresets as GradientPreset[]).map((preset) => ({
  id: slugifyThemeName(preset.name),
  name: preset.name,
  gradient: buildLinearGradient(preset.colors)
}));

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
