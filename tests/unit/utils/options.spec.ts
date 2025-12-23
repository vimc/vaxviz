import { describe, it, expect } from 'vitest';
import { dimensionOptionLabel } from '@/utils/options';

describe('options utils', () => {
  it('dimensionOptionLabel can get a label from a value and dimension', () => {
    expect(dimensionOptionLabel('location', 'UKR')).toBe('Ukraine');
    expect(dimensionOptionLabel('location', 'global')).toBe('All 117 VIMC countries');
    expect(dimensionOptionLabel('location', 'Middle Africa')).toBe('Middle Africa');
    expect(dimensionOptionLabel('disease', 'Measles')).toBe('Measles');
    expect(dimensionOptionLabel('activity_type', 'campaign')).toBe('Campaign');
  });

  it('if the value is not recognised, dimensionOptionLabel returns the value verbatim', () => {
    expect(dimensionOptionLabel('location', 'kitchen')).toBe('kitchen');
  });
});
