import { describe, expect, it } from 'vitest';
import { modeFromSliderValue, snapSliderValue } from '../src/lib/slider';

describe('slider mapping', () => {
  it('maps low values to simplify', () => {
    expect(modeFromSliderValue(0)).toBe('simplify');
    expect(modeFromSliderValue(32)).toBe('simplify');
    expect(snapSliderValue(10)).toEqual({ mode: 'simplify', snappedValue: 0, label: 'Simplify' });
  });

  it('maps middle values to original', () => {
    expect(modeFromSliderValue(33)).toBe('original');
    expect(modeFromSliderValue(65)).toBe('original');
    expect(snapSliderValue(50)).toEqual({ mode: 'original', snappedValue: 50, label: 'Original' });
  });

  it('maps high values to deep', () => {
    expect(modeFromSliderValue(66)).toBe('deep');
    expect(modeFromSliderValue(100)).toBe('deep');
    expect(snapSliderValue(90)).toEqual({ mode: 'deep', snappedValue: 100, label: 'Deep' });
  });
});
