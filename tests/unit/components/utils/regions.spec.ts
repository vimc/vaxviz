import { describe, it, expect } from 'vitest'
import { getCountryName, getSubregionFromCountry } from '@/utils/regions';

describe("getCountryName", () => {
  it("can get country name from ISO3 code", () => {
    expect(getCountryName("AFG")).toBe("Afghanistan");
    expect(getCountryName("USA")).toBe("United States of America");
    expect(getCountryName("XYZ")).toBe("");
  });
});

describe("getSubregionFromCountry", () => {
  it("can get subregion from ISO3 code", () => {
    expect(getSubregionFromCountry("AFG")).toBe("Central and Southern Asia");
    expect(getSubregionFromCountry("USA")).toBe("Northern America");
    expect(getSubregionFromCountry("XYZ")).toBe("");
  });
});
