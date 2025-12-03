import { setActivePinia, createPinia } from "pinia";
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/stores/appStore";
import { nextTick } from "vue";

describe("appStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("has correct default values", () => {
    const store = useAppStore();
    expect(store.countryOptions).toEqual([]);
    expect(store.subregionOptions).toEqual([]);
    expect(store.diseaseOptions).toEqual([]);
    expect(store.burdenMetric).toBe("deaths");
    expect(store.logScaleEnabled).toBe(true);
    expect(store.splitByActivityType).toBe(false);
    expect(store.exploreBy).toBe("location");
    expect(store.focus).toBe("global");
    expect(store.dimensions).toEqual({
      x: null,
      y: "disease",
      withinBand: "location",
    });
  });

  it("initializes country options, subregion options, and disease options", () => {
    const store = useAppStore();
    expect(store.countryOptions).toHaveLength(0);
    expect(store.subregionOptions).toHaveLength(0);
    expect(store.diseaseOptions).toHaveLength(0);

    store.initialize();

    expect(store.countryOptions).toHaveLength(117);
    expect(store.subregionOptions).toHaveLength(10);
    expect(store.diseaseOptions).toHaveLength(14);

    expect(store.countryOptions[0]).toEqual({
      label: "Afghanistan",
      value: "AFG",
    })
    expect(store.subregionOptions[0]).toEqual({
      label: "Central and Southern Asia",
      value: "Central and Southern Asia",
    })
    expect(store.diseaseOptions[0]).toEqual({
      label: "Cholera",
      value: "Cholera",
    })
  });

  it("updates the focus value when exploreBy selection changes", async () => {
    const store = useAppStore();
    store.initialize();

    expect(store.focus).toEqual("global");
    expect(store.exploreBy).toEqual("location");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.focus).toEqual("Cholera");

    store.exploreBy = "location";
    await nextTick();

    expect(store.focus).toEqual("global");
  });

  it("updates the y-categorical axis and within-band axis when focus changes", async () => {
    const store = useAppStore();
    store.initialize();
    expect(store.focus).toEqual("global");
    expect(store.exploreBy).toEqual("location");
    expect(store.dimensions.y).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");

    store.focus = "AFG";
    await nextTick();

    expect(store.dimensions.y).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");

    store.focus = "Cholera";
    await nextTick();

    expect(store.dimensions.y).toEqual("location");
    expect(store.dimensions.withinBand).toEqual("disease");

    store.focus = "Central and Southern Asia";
    await nextTick();

    expect(store.dimensions.y).toEqual("disease");
    expect(store.dimensions.withinBand).toEqual("location");
  });

  it("returns the explore by label", async () => {
    const store = useAppStore();
    store.initialize();

    expect(store.exploreByLabel).toEqual("Geography");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.exploreByLabel).toEqual("Disease");
  });
});
