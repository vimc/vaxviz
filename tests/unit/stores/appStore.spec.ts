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
    expect(store.focus).toBe("global");
    expect(store.dimensions).toEqual({
      column: null,
      row: "disease",
      withinBand: "location",
    });
    expect(store.hardFilters).toEqual(expectedInitialFilters);
    expect(store.softFilters).toEqual(expectedInitialFilters);
  });

  it("updates the focus value when exploreBy selection changes", async () => {
    const store = useAppStore();

    expect(store.focus).toEqual("global");
    expect(store.exploreBy).toEqual("location");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.focus).toEqual("Cholera");

    store.exploreBy = "location";
    await nextTick();

    expect(store.focus).toEqual("global");
  });

  it("updates the dimensions and filters when focus changes", async () => {
    const store = useAppStore();

    expect(store.focus).toEqual("global");
    expect(store.exploreBy).toEqual("location");
    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.hardFilters.disease).toHaveLength(diseaseOptions.length);
    expect(store.hardFilters.location).toEqual(["global"]);
    expect(store.softFilters.disease).toHaveLength(diseaseOptions.length);
    expect(store.softFilters.location).toEqual(["global"]);

    store.focus = "AFG";
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.hardFilters.disease).toHaveLength(diseaseOptions.length);
    expect(store.hardFilters.location).toEqual(["AFG", "Central and Southern Asia", "global"]);
    expect(store.softFilters.disease).toHaveLength(diseaseOptions.length);
    expect(store.softFilters.location).toEqual(["AFG", "Central and Southern Asia", "global"]);

    store.focus = "Cholera";
    await nextTick();

    expect(store.dimensions.row).toEqual("location");
    expect(store.dimensions.withinBand).toEqual("disease");
    expect(store.hardFilters.disease).toEqual(["Cholera"]);
    expect(store.hardFilters.location).toHaveLength(11);
    expect(store.hardFilters.location).toContain("global");
    expect(store.softFilters.disease).toEqual(["Cholera"]);
    expect(store.softFilters.location).toHaveLength(11);
    expect(store.softFilters.location).toContain("global");

    store.focus = "Middle Africa";
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.hardFilters.disease).toHaveLength(diseaseOptions.length);
    expect(store.hardFilters.location).toEqual(["Middle Africa", "global"]);
    expect(store.softFilters.disease).toHaveLength(diseaseOptions.length);
    expect(store.softFilters.location).toEqual(["Middle Africa", "global"]);
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

  it("can reset the soft filters", () => {
    const store = useAppStore();

    expect(store.hardFilters).toEqual(expectedInitialFilters);
    expect(store.softFilters).toEqual(expectedInitialFilters);

    store.softFilters.disease = ["Cholera", "Measles"];
    store.softFilters.location = ["AFG", "global"];

    expect(store.softFilters.disease).toEqual(["Cholera", "Measles"]);
    expect(store.softFilters.location).toEqual(["AFG", "global"]);

    store.resetSoftFilters();

    expect(store.softFilters).toEqual(expectedInitialFilters);
  });
});
