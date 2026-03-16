import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

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
    expect(store.isShown('negativeValues')).toBe(false);
    expect(store.isHighlighted('negativeValues')).toBe(false);
    expect(store.helpInfoShowCounts.negativeValues).toBe(0);
    expect(store.helpInfoHighlightCounts.negativeValues).toBe(0);
  });

  describe("show and unShow", () => {
    it("shows help info and increments show count after delay", () => {
      const store = useHelpInfoStore();

      store.show('negativeValues', 1000);
      expect(store.isShown('negativeValues')).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(store.isShown('negativeValues')).toBe(true);
      expect(store.helpInfoShowCounts.negativeValues).toBe(1);
    });

    it("shows help info immediately with zero delay", () => {
      const store = useHelpInfoStore();

      store.show('negativeValues', 0);
      vi.advanceTimersByTime(0);

      expect(store.isShown('negativeValues')).toBe(true);
      expect(store.helpInfoShowCounts.negativeValues).toBe(1);
    });

    it("unShow hides help info", () => {
      const store = useHelpInfoStore();

      store.show('negativeValues');
      vi.advanceTimersByTime(0);
      expect(store.isShown('negativeValues')).toBe(true);

      store.unShow('negativeValues');
      expect(store.isShown('negativeValues')).toBe(false);
    });

    it("unShow cancels a pending show timeout", () => {
      const store = useHelpInfoStore();

      store.show('negativeValues', 1000);
      store.unShow('negativeValues');

      vi.advanceTimersByTime(5000);
      expect(store.isShown('negativeValues')).toBe(false);
      expect(store.helpInfoShowCounts.negativeValues).toBe(0);
    });

    it("increments show count each time show completes", () => {
      const store = useHelpInfoStore();

      store.show('negativeValues');
      vi.advanceTimersByTime(0);
      store.unShow('negativeValues');
      store.show('negativeValues');
      vi.advanceTimersByTime(0);

      expect(store.helpInfoShowCounts.negativeValues).toBe(2);
    });
  });

  describe("highlightOnce", () => {
    it("highlights when help info is shown and has not been highlighted before", () => {
      const store = useHelpInfoStore();
      store.show('negativeValues');
      vi.advanceTimersByTime(0);

      store.highlightOnce('negativeValues');

      expect(store.isHighlighted('negativeValues')).toBe(true);
    });

    it("does not highlight when help info is not shown", () => {
      const store = useHelpInfoStore();

      store.highlightOnce('negativeValues');

      expect(store.isHighlighted('negativeValues')).toBe(false);
    });

    it("resets highlighted to false after 2000ms", () => {
      const store = useHelpInfoStore();
      store.show('negativeValues');
      vi.advanceTimersByTime(0);

      store.highlightOnce('negativeValues');
      expect(store.isHighlighted('negativeValues')).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(store.isHighlighted('negativeValues')).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.isHighlighted('negativeValues')).toBe(false);
    });

    it("does not highlight again if already highlighted once before", () => {
      const store = useHelpInfoStore();
      store.show('negativeValues');
      vi.advanceTimersByTime(0);

      store.highlightOnce('negativeValues');
      vi.advanceTimersByTime(2000); // let first highlight expire

      store.highlightOnce('negativeValues');
      expect(store.isHighlighted('negativeValues')).toBe(false);
      expect(store.helpInfoHighlightCounts.negativeValues).toBe(1);
    });

    it("does not affect highlight if a highlight is already in progress", () => {
      const store = useHelpInfoStore();
      store.show('negativeValues');
      vi.advanceTimersByTime(0);

      store.highlightOnce('negativeValues');
      expect(store.isHighlighted('negativeValues')).toBe(true);

      vi.advanceTimersByTime(1000);
      store.highlightOnce('negativeValues');

      vi.advanceTimersByTime(999);
      expect(store.isHighlighted('negativeValues')).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.isHighlighted('negativeValues')).toBe(false);
    });
  });
});
