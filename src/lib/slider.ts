import type { TransformMode } from './types';

export interface SliderState {
  mode: TransformMode;
  snappedValue: number;
  label: string;
}

export function modeFromSliderValue(rawValue: number): TransformMode {
  if (rawValue < 33) {
    return 'simplify';
  }

  if (rawValue < 66) {
    return 'original';
  }

  return 'deep';
}

export function snapSliderValue(rawValue: number): SliderState {
  const mode = modeFromSliderValue(rawValue);

  if (mode === 'simplify') {
    return { mode, snappedValue: 0, label: 'Simplify' };
  }

  if (mode === 'original') {
    return { mode, snappedValue: 50, label: 'Original' };
  }

  return { mode, snappedValue: 100, label: 'Deep' };
}
