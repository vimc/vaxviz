import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { nextTick } from "vue";

import { useHelpInfoStore } from "@/stores/helpInfoStore";

describe("helpInfo store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has expected initial state", () => {
    const store = useHelpInfoStore();
    expect(store.showNegativeValuesHelpInfo).toBe(false);
    expect(store.negativeValueHelpMessageIsHighlighted).toBe(false);
    expect(store.negativeHelpInfoShowCount).toBe(0);
    expect(store.negativeHelpInfoHighlightCount).toBe(0);
  });

  describe("negativeHelpInfoShowCount watcher", () => {
    it("increments when showNegativeValuesHelpInfo becomes true", async () => {
      const store = useHelpInfoStore();

      store.showNegativeValuesHelpInfo = true;
      await nextTick();
      expect(store.negativeHelpInfoShowCount).toBe(1);
    });

    it("does not increment when showNegativeValuesHelpInfo becomes false", async () => {
      const store = useHelpInfoStore();

      store.showNegativeValuesHelpInfo = true;
      await nextTick();
      expect(store.negativeHelpInfoShowCount).toBe(1);

      store.showNegativeValuesHelpInfo = false;
      await nextTick();
      expect(store.negativeHelpInfoShowCount).toBe(1);
    });

    it("increments each time showNegativeValuesHelpInfo is toggled on", async () => {
      const store = useHelpInfoStore();

      store.showNegativeValuesHelpInfo = true;
      await nextTick();
      store.showNegativeValuesHelpInfo = false;
      await nextTick();
      store.showNegativeValuesHelpInfo = true;
      await nextTick();

      expect(store.negativeHelpInfoShowCount).toBe(2);
    });
  });

  describe("negativeHelpInfoHighlightCount watcher", () => {
    it("increments when negativeValueHelpMessageIsHighlighted becomes true", async () => {
      const store = useHelpInfoStore();

      store.negativeValueHelpMessageIsHighlighted = true;
      await nextTick();
      expect(store.negativeHelpInfoHighlightCount).toBe(1);
    });

    it("does not increment when negativeValueHelpMessageIsHighlighted becomes false", async () => {
      const store = useHelpInfoStore();

      store.negativeValueHelpMessageIsHighlighted = true;
      await nextTick();
      store.negativeValueHelpMessageIsHighlighted = false;
      await nextTick();

      expect(store.negativeHelpInfoHighlightCount).toBe(1);
    });
  });

  describe("applyHighlightingToNegativeHelpInfo", () => {
    it("sets negativeValueHelpMessageIsHighlighted to true when help info is shown", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = true;

      store.applyHighlightingToNegativeHelpInfo();

      expect(store.negativeValueHelpMessageIsHighlighted).toBe(true);
    });

    it("does not set highlight when help info is not shown", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = false;

      store.applyHighlightingToNegativeHelpInfo();

      expect(store.negativeValueHelpMessageIsHighlighted).toBe(false);
    });

    it("resets negativeValueHelpMessageIsHighlighted to false after 2000ms", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = true;

      store.applyHighlightingToNegativeHelpInfo();
      expect(store.negativeValueHelpMessageIsHighlighted).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(store.negativeValueHelpMessageIsHighlighted).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.negativeValueHelpMessageIsHighlighted).toBe(false);
    });

    it("does not affect highlight if a highlight is already in progress", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = true;

      store.applyHighlightingToNegativeHelpInfo();
      expect(store.negativeValueHelpMessageIsHighlighted).toBe(true);

      vi.advanceTimersByTime(1000);
      store.applyHighlightingToNegativeHelpInfo();

      vi.advanceTimersByTime(999);
      expect(store.negativeValueHelpMessageIsHighlighted).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.negativeValueHelpMessageIsHighlighted).toBe(false);
    });
  });
});
