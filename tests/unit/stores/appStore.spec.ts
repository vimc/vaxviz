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
    expect(store.initialized).toBe(false);
    expect(store.countryOptions).toEqual([]);
    expect(store.subregionOptions).toEqual([]);
    expect(store.diseaseOptions).toEqual([]);
    expect(store.burdenMetric).toBe("deaths");
    expect(store.useLogScale).toBe(true);
    expect(store.splitByActivityType).toBe(false);
    expect(store.exploreBy).toBe("disease");
    expect(store.focus).toBe("");
  });

  it("initializes country options, subregion options, and disease options", async () => {
    const store = useAppStore();
    expect(store.countryOptions).toHaveLength(0);
    expect(store.subregionOptions).toHaveLength(0);
    expect(store.diseaseOptions).toHaveLength(0);
    expect(store.initialized).toBe(false);

    await store.initialize();

    expect(store.initialized).toBe(true);
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

    await store.initialize();

    expect(store.focus).toEqual("");
    expect(store.exploreBy).toEqual("disease");

    store.exploreBy = "location";
    await nextTick();

    expect(store.focus).toEqual("global");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.focus).toEqual("Cholera");
  });

  it("returns the explore by label", async () => {
    const store = useAppStore();

    await store.initialize();

    expect(store.exploreByLabel).toEqual("Disease");

    store.exploreBy = "location";
    await nextTick();

    expect(store.exploreByLabel).toEqual("Geography");
  });
});
