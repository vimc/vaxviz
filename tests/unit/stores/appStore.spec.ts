import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach } from "vitest";
import { nextTick } from "vue";
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { useAppStore } from "@/stores/appStore";

describe("app store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
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
    expect(store.filters).toEqual({
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
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["global"]);

    store.focus = "AFG";
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["AFG", "Central and Southern Asia", "global"]);

    store.focus = "Cholera";
    await nextTick();

    expect(store.dimensions.row).toEqual("location");
    expect(store.dimensions.withinBand).toEqual("disease");
    expect(store.filters.disease).toEqual(["Cholera"]);
    expect(store.filters.location).toHaveLength(11);
    expect(store.filters.location).toContain("global");

    store.focus = "Middle Africa";
    await nextTick();

    expect(store.dimensions.row).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
    expect(store.filters.disease).toHaveLength(diseaseOptions.length);
    expect(store.filters.location).toEqual(["Middle Africa", "global"]);
  });

  it("returns the explore by label", async () => {
    const store = useAppStore();

    expect(store.exploreByLabel).toEqual("Geography");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.exploreByLabel).toEqual("Disease");
  });
});
