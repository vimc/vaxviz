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
    expect(store.burdenMetric).toBe("deaths");
    expect(store.useLogScale).toBe(true);
    expect(store.splitByActivityType).toBe(false);
    expect(store.exploreBy).toBe("location");
    expect(store.focus).toBe("global");
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

  it("returns the explore by label", async () => {
    const store = useAppStore();

    expect(store.exploreByLabel).toEqual("Geography");

    store.exploreBy = "disease";
    await nextTick();

    expect(store.exploreByLabel).toEqual("Disease");
  });
});
