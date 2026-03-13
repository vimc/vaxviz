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
    expect(store.highlightNegativeValuesHelpMessage).toBe(false);
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
    it("increments when highlightNegativeValuesHelpMessage becomes true", async () => {
      const store = useHelpInfoStore();

      store.highlightNegativeValuesHelpMessage = true;
      await nextTick();
      expect(store.negativeHelpInfoHighlightCount).toBe(1);
    });

    it("does not increment when highlightNegativeValuesHelpMessage becomes false", async () => {
      const store = useHelpInfoStore();

      store.highlightNegativeValuesHelpMessage = true;
      await nextTick();
      store.highlightNegativeValuesHelpMessage = false;
      await nextTick();

      expect(store.negativeHelpInfoHighlightCount).toBe(1);
    });
  });

  describe("applyHighlightingToNegativeHelpInfo", () => {
    it("sets highlightNegativeValuesHelpMessage to true when help info is shown", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = true;

      store.applyHighlightingToNegativeHelpInfo();

      expect(store.highlightNegativeValuesHelpMessage).toBe(true);
    });

    it("does not set highlight when help info is not shown", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = false;

      store.applyHighlightingToNegativeHelpInfo();

      expect(store.highlightNegativeValuesHelpMessage).toBe(false);
    });

    it("resets highlightNegativeValuesHelpMessage to false after 2000ms", () => {
      const store = useHelpInfoStore();
      store.showNegativeValuesHelpInfo = true;

      store.applyHighlightingToNegativeHelpInfo();
      expect(store.highlightNegativeValuesHelpMessage).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(store.highlightNegativeValuesHelpMessage).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.highlightNegativeValuesHelpMessage).toBe(false);
    });
  });
});
