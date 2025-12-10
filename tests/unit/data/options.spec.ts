import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import { describe, it, expect } from "vitest";

describe("options pre-built data", () => {
  it("country options, subregion options, and disease options are present", () => {
    expect(countryOptions[0]).toEqual({
      label: "Afghanistan",
      value: "AFG",
    })
    expect(subregionOptions[0]).toEqual({
      label: "Central and Southern Asia",
      value: "Central and Southern Asia",
    })
    expect(diseaseOptions[0]).toEqual({
      label: "Cholera",
      value: "Cholera",
    })
  });
});
