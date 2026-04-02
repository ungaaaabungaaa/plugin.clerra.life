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

const FALLBACK_GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Ocean Glow', colors: ['#091E3A', '#2F80ED', '#2D9EE0'] },
  { name: 'Purple Dream', colors: ['#bf5ae0', '#a811da'] },
  { name: 'Sunset Heat', colors: ['#F7941E', '#F94632'] },
  { name: 'Emerald Tide', colors: ['#159957', '#155799'] },
  { name: 'Neon Blend', colors: ['#00F5A0', '#00D9F5'] },
  { name: 'Midnight City', colors: ['#232526', '#414345'] }
];

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

function isValidGradientPreset(value: unknown): value is GradientPreset {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<GradientPreset>;
  return typeof candidate.name === 'string'
    && Array.isArray(candidate.colors)
    && candidate.colors.length >= 2
    && candidate.colors.every((color) => typeof color === 'string' && color.trim().length > 0);
}

function resolveGradientPresets(): GradientPreset[] {
  const source = Array.isArray(gradientPresets) ? gradientPresets : [];
  const validPresets = source.filter(isValidGradientPreset);
  return validPresets.length > 0 ? validPresets : FALLBACK_GRADIENT_PRESETS;
}

export const THEMES: ThemePreset[] = resolveGradientPresets().map((preset) => ({
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
