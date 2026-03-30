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
  { id: 'bubblegum', name: 'Bubblegum', gradient: 'linear-gradient(135deg, #e296b1 0%, #de93c7 100%)' },
  { id: 'coastline', name: 'Coastline', gradient: 'linear-gradient(135deg, #4e9fd0 0%, #5ca6ce 100%)' },
  { id: 'mint-glass', name: 'Mint Glass', gradient: 'linear-gradient(135deg, #77cfbf 0%, #7ec6a6 100%)' },
  { id: 'apricot', name: 'Apricot', gradient: 'linear-gradient(135deg, #f0aa7b 0%, #ef8f8f 100%)' },
  { id: 'midnight-lake', name: 'Midnight Lake', gradient: 'linear-gradient(135deg, #24395a 0%, #365e79 100%)' },
  { id: 'pearl', name: 'Pearl', gradient: 'linear-gradient(135deg, #f6f0ea 0%, #ddd7f2 100%)' },
  { id: 'citrus-fade', name: 'Citrus Fade', gradient: 'linear-gradient(135deg, #f6db7d 0%, #f1b778 100%)' },
  { id: 'lavender-soda', name: 'Lavender Soda', gradient: 'linear-gradient(135deg, #c7b6f4 0%, #e3b7e8 100%)' },
  { id: 'forest-haze', name: 'Forest Haze', gradient: 'linear-gradient(135deg, #447d68 0%, #75b28d 100%)' },
  { id: 'rose-milk', name: 'Rose Milk', gradient: 'linear-gradient(135deg, #f4b4c7 0%, #f2d1cc 100%)' },
  { id: 'ember', name: 'Ember', gradient: 'linear-gradient(135deg, #db684f 0%, #f2a65a 100%)' },
  { id: 'storm', name: 'Storm', gradient: 'linear-gradient(135deg, #49536d 0%, #6a8aa6 100%)' },
  { id: 'plum-sky', name: 'Plum Sky', gradient: 'linear-gradient(135deg, #8b709d 0%, #c998bb 100%)' },
  { id: 'cocoa', name: 'Cocoa', gradient: 'linear-gradient(135deg, #7f5a58 0%, #c08a63 100%)' },
  { id: 'atlas', name: 'Atlas', gradient: 'linear-gradient(135deg, #4ea6a2 0%, #7dcdd2 100%)' },
  { id: 'ink', name: 'Ink', gradient: 'linear-gradient(135deg, #1b2236 0%, #3b4571 100%)' },
  { id: 'sugar-rush', name: 'Sugar Rush', gradient: 'linear-gradient(135deg, #ff9bb2 0%, #ffd17d 100%)' },
  { id: 'seafoam', name: 'Seafoam', gradient: 'linear-gradient(135deg, #98e3d8 0%, #5fb9b1 100%)' },
  { id: 'candy-night', name: 'Candy Night', gradient: 'linear-gradient(135deg, #5f3b74 0%, #d8658e 100%)' },
  { id: 'linen', name: 'Linen', gradient: 'linear-gradient(135deg, #efe4d6 0%, #dcc6b1 100%)' }
];

export const ACCENTS: AccentPreset[] = [
  { id: 'pink', name: 'Pink', color: '#ee98b4' },
  { id: 'sun', name: 'Sun', color: '#f5cc5b' },
  { id: 'coral', name: 'Coral', color: '#f05a3e' },
  { id: 'mint', name: 'Mint', color: '#59c293' },
  { id: 'sky', name: 'Sky', color: '#53a8d6' },
  { id: 'violet', name: 'Violet', color: '#9b83e3' },
  { id: 'graphite', name: 'Graphite', color: '#1c1b22' },
  { id: 'cream', name: 'Cream', color: '#fff7df' }
];

export function getThemeById(themeId: string): ThemePreset {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}

export function getAccentById(accentId: string): AccentPreset {
  return ACCENTS.find((accent) => accent.id === accentId) ?? ACCENTS[0];
}
