import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { nextTick } from "vue";
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { useAppStore } from "@/stores/appStore";

const expectedInitialFilters = Object.freeze({
  disease: [
    "Cholera",
    "COVID-19",
    "HepB",
    "Hib",
    "HPV",
    "JE",
    "Malaria",
    "Measles",
    "MenA",
    "MenACWYX",
    "Meningitis",
    "PCV",
    "Rota",
    "Rubella",
    "Typhoid",
    "YF",
  ],
  location: ["global"],
});

describe("app store", () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it("has correct default values", () => {
    const store = useAppStore();

    expect(store.burdenMetric).toBe("deaths");
    expect(store.logScaleEnabled).toBe(true);
    expect(store.splitByActivityType).toBe(false);
    expect(store.exploreBy).toBe("location");
    expect(store.focuses).toEqual(["global"]);
    expect(store.dimensions).toEqual({
      column: null,
      row: "disease",
      withinBand: "location",
    });
    expect(store.filters).toEqual(expectedInitialFilters);
    expect(store.legendSelections).toEqual(expectedInitialFilters);
  });

  it("updates the focuses when exploreBy selection changes", async () => {
    const store = useAppStore();

    expect(store.focuses).toEqual(["global"]);
    expect(store.exploreBy).toEqual("location");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.focuses).toEqual(["Cholera"]);

    store.exploreBy = "location";
    await nextTick();

    expect(store.focuses).toEqual(["global"]);
  });

  it("throws an error if any focuses value is invalid for the current exploreBy selection", async () => {
    const store = useAppStore();

    expect(store.focuses).toEqual(["global"]);
    expect(store.exploreBy).toEqual("location");

    await expect(async () => {
      store.focuses = ["global", "Malaria"];
      await nextTick();
    }).rejects.toThrow();

    store.exploreBy = "disease";
    await nextTick();

    expect(store.focuses).toEqual(["Cholera"]);

    await expect(async () => {
      store.focuses = ["global"];
      await nextTick();
    }).rejects.toThrow();
  });

  it("updates the dimensions and filters when focuses change (for a single focus)", async () => {
    const store = useAppStore();

    expect(store.focuses).toEqual(["global"]);
    expect(store.exploreBy).toEqual("location");
    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["global"]);
    expect(store.legendSelections.disease).toHaveLength(diseaseOptions.length);
    expect(store.legendSelections.location).toEqual(["global"]);

    store.focuses = ["AFG"];
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["AFG", "Central and Southern Asia", "global"]);
    expect(store.legendSelections.disease).toHaveLength(diseaseOptions.length);
    expect(store.legendSelections.location).toEqual(["AFG", "Central and Southern Asia", "global"]);

    store.exploreBy = "disease";
    store.focuses = ["Cholera"];
    await nextTick();

    expect(store.dimensions.row).toEqual("location");
    expect(store.dimensions.withinBand).toEqual("disease");
    expect(store.filters.disease).toEqual(["Cholera"]);
    expect(store.filters.location).toHaveLength(11);
    expect(store.filters.location).toContain("global");
    expect(store.legendSelections.disease).toEqual(["Cholera"]);
    expect(store.legendSelections.location).toHaveLength(11);
    expect(store.legendSelections.location).toContain("global");

    store.exploreBy = "location";
    await nextTick();
    store.focuses = ["Middle Africa"];
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["Middle Africa", "global"]);
    expect(store.legendSelections.disease).toHaveLength(diseaseOptions.length);
    expect(store.legendSelections.location).toEqual(["Middle Africa", "global"]);
  });

  it("updates the dimensions and filters when focuses change (for multiple focuses)", async () => {
    const store = useAppStore();

    expect(store.focuses).toEqual(["global"]);
    expect(store.exploreBy).toEqual("location");

    store.focuses = ["AFG", "global"];
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["AFG", "global"]);
    expect(store.legendSelections.disease).toHaveLength(diseaseOptions.length);
    expect(store.legendSelections.location).toEqual(["AFG", "global"]);

    store.exploreBy = "disease";
    await nextTick();
    store.focuses = ["Cholera", "Malaria"];
    await nextTick();

    expect(store.dimensions.row).toEqual("location");
    expect(store.dimensions.withinBand).toEqual("disease");
    expect(store.filters.disease).toEqual(["Cholera", "Malaria"]);
    expect(store.filters.location).toHaveLength(11);
    expect(store.filters.location).toContain("global");
    expect(store.legendSelections.disease).toEqual(["Cholera", "Malaria"]);
    expect(store.legendSelections.location).toHaveLength(11);
    expect(store.legendSelections.location).toContain("global");

    store.exploreBy = "location";
    await nextTick();
    store.focuses = ["Middle Africa", "Eastern Africa"];
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["Middle Africa", "Eastern Africa"]);
    expect(store.legendSelections.disease).toHaveLength(diseaseOptions.length);
    expect(store.legendSelections.location).toEqual(["Middle Africa", "Eastern Africa"]);
  });

  it("returns the explore by label", async () => {
    const store = useAppStore();

    expect(store.exploreByLabel).toEqual("Geography");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.exploreByLabel).toEqual("Disease");
  });

  it("updates the column dimension when splitByActivityType changes", async () => {
    const store = useAppStore();

    expect(store.splitByActivityType).toBe(false);
    expect(store.dimensions.column).toBeNull();

    store.splitByActivityType = true;
    await nextTick();

    expect(store.dimensions.column).toEqual("activity_type");

    store.splitByActivityType = false;
    await nextTick();

    expect(store.dimensions.column).toBeNull();
  });

  it("can get the axis for a given dimension", async () => {
    const store = useAppStore();

    expect(store.getAxisForDimension("location")).toEqual("withinBand");
    expect(store.getAxisForDimension("disease")).toEqual("row");

    store.splitByActivityType = true;
    await nextTick();

    expect(store.getAxisForDimension("activity_type")).toEqual("column");
  });

  it("can return the geographical resolution for a given location", async () => {
    const store = useAppStore();

    expect(store.geographicalResolutionForLocation("global")).toEqual("global");
    expect(store.geographicalResolutionForLocation("AFG")).toEqual("country");
    expect(store.geographicalResolutionForLocation("Central and Southern Asia")).toEqual("subregion");
    expect(store.geographicalResolutionForLocation("Cholera")).toBeUndefined();
  });

  it("can reset the legend selections", () => {
    const store = useAppStore();

    expect(store.filters).toEqual(expectedInitialFilters);
    expect(store.legendSelections).toEqual(expectedInitialFilters);

    store.legendSelections.disease = ["Cholera", "Measles"];
    store.legendSelections.location = ["AFG", "global"];

    expect(store.legendSelections.disease).toEqual(["Cholera", "Measles"]);
    expect(store.legendSelections.location).toEqual(["AFG", "global"]);

    store.resetLegendSelections();

    expect(store.legendSelections).toEqual(expectedInitialFilters);
  });

  it("can reset the focuses", async () => {
    const store = useAppStore();

    store.focuses = ["AFG", "global"];
    await nextTick();
    expect(store.focuses).toEqual(["AFG", "global"]);
    store.resetFocuses();
    await nextTick();
    expect(store.focuses).toEqual(["global"]);

    store.exploreBy = "disease";
    await nextTick();
    expect(store.focuses).toEqual(["Cholera"]);
    store.focuses = ["Cholera", "Measles"];
    await nextTick();
    expect(store.focuses).toEqual(["Cholera", "Measles"]);
    store.resetFocuses();
    await nextTick();

    expect(store.focuses).toEqual(["Cholera"]);
  });
});
