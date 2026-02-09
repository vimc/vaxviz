import { describe, it, expect } from 'vitest';
import { getDimensionCategoryValue } from '@/utils/fileParse';

describe('fileParse utils', () => {
  it('getDimensionCategoryValue can parse a data row with a location', () => {
    const dataRow = {
      location: 'USA',
      disease: 'Flu',
    };

    expect(getDimensionCategoryValue('location', dataRow)).toBe('USA');
    expect(getDimensionCategoryValue('disease', dataRow)).toBe('Flu');
  });

  it('getDimensionCategoryValue can parse a data row without a location', () => {
    const dataRow = {
      disease: 'Flu',
    };

    expect(getDimensionCategoryValue('location', dataRow)).toBe('global');
    expect(getDimensionCategoryValue('disease', dataRow)).toBe('Flu');
  });
});
