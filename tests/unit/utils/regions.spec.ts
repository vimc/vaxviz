import { describe, it, expect } from 'vitest';
import { getCountryName, getSubregionFromCountry } from '@/utils/regions';

describe('regions utils', () => {
  it('getSubregionFromCountry can get the subregion for a country', () => {
    expect(getSubregionFromCountry('UKR')).toBe('Eastern and Southern Europe');
  });

  it('getSubregionFromCountry returns an empty string for an unrecognised country', () => {
    expect(getSubregionFromCountry('kitchen')).toBe('');
  });

  it('getCountryName can get the country name for a country', () => {
    expect(getCountryName('UKR')).toBe('Ukraine');
  });

  it('getCountryName returns an empty string for an unrecognised country', () => {
    expect(getCountryName('kitchen')).toBe('');
  });
});
