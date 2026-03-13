import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import { negativeValuesHelpInfoId, useHelpInfoStore } from "@/stores/helpInfoStore";

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
    expect(store.isShown(negativeValuesHelpInfoId)).toBe(false);
    expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(false);
    expect(store.helpInfoShowCounts[negativeValuesHelpInfoId]).toBe(0);
    expect(store.helpInfoHighlightCounts[negativeValuesHelpInfoId]).toBe(0);
  });

  describe("show and unShow", () => {
    it("shows help info and increments show count after delay", () => {
      const store = useHelpInfoStore();

      store.show(negativeValuesHelpInfoId, 1000);
      expect(store.isShown(negativeValuesHelpInfoId)).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(store.isShown(negativeValuesHelpInfoId)).toBe(true);
      expect(store.helpInfoShowCounts[negativeValuesHelpInfoId]).toBe(1);
    });

    it("shows help info immediately with zero delay", () => {
      const store = useHelpInfoStore();

      store.show(negativeValuesHelpInfoId, 0);
      vi.advanceTimersByTime(0);

      expect(store.isShown(negativeValuesHelpInfoId)).toBe(true);
      expect(store.helpInfoShowCounts[negativeValuesHelpInfoId]).toBe(1);
    });

    it("unShow hides help info", () => {
      const store = useHelpInfoStore();

      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);
      expect(store.isShown(negativeValuesHelpInfoId)).toBe(true);

      store.unShow(negativeValuesHelpInfoId);
      expect(store.isShown(negativeValuesHelpInfoId)).toBe(false);
    });

    it("unShow cancels a pending show timeout", () => {
      const store = useHelpInfoStore();

      store.show(negativeValuesHelpInfoId, 1000);
      store.unShow(negativeValuesHelpInfoId);

      vi.advanceTimersByTime(5000);
      expect(store.isShown(negativeValuesHelpInfoId)).toBe(false);
      expect(store.helpInfoShowCounts[negativeValuesHelpInfoId]).toBe(0);
    });

    it("increments show count each time show completes", () => {
      const store = useHelpInfoStore();

      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);
      store.unShow(negativeValuesHelpInfoId);
      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);

      expect(store.helpInfoShowCounts[negativeValuesHelpInfoId]).toBe(2);
    });
  });

  describe("highlightOnce", () => {
    it("highlights when help info is shown and has not been highlighted before", () => {
      const store = useHelpInfoStore();
      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);

      store.highlightOnce(negativeValuesHelpInfoId);

      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(true);
    });

    it("does not highlight when help info is not shown", () => {
      const store = useHelpInfoStore();

      store.highlightOnce(negativeValuesHelpInfoId);

      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(false);
    });

    it("resets highlighted to false after 2000ms", () => {
      const store = useHelpInfoStore();
      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);

      store.highlightOnce(negativeValuesHelpInfoId);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(true);

      vi.advanceTimersByTime(1999);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(false);
    });

    it("does not highlight again if already highlighted once before", () => {
      const store = useHelpInfoStore();
      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);

      store.highlightOnce(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(2000); // let first highlight expire

      store.highlightOnce(negativeValuesHelpInfoId);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(false);
      expect(store.helpInfoHighlightCounts[negativeValuesHelpInfoId]).toBe(1);
    });

    it("does not affect highlight if a highlight is already in progress", () => {
      const store = useHelpInfoStore();
      store.show(negativeValuesHelpInfoId);
      vi.advanceTimersByTime(0);

      store.highlightOnce(negativeValuesHelpInfoId);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(true);

      vi.advanceTimersByTime(1000);
      store.highlightOnce(negativeValuesHelpInfoId);

      vi.advanceTimersByTime(999);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(true);

      vi.advanceTimersByTime(1);
      expect(store.isHighlighted(negativeValuesHelpInfoId)).toBe(false);
    });
  });
});
