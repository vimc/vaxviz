import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useAppStore } from "./appStore";

// jsdom is incompatible with focus-trap, so disable focus-traps in tests
const appMode = import.meta.env.MODE;
// focus-trap is an accessibility feature for modal dialogs
const enableFocusTraps = appMode !== 'test';

export const negativeValuesHelpInfoId = "negativeValues";
export const logScaleHelpInfoId = "logScale";
export type HelpInfoId = "negativeValues" | "logScale";

export const useHelpInfoStore = defineStore("helpInfo", () => {
  const appStore = useAppStore();

  // Track which help infos are currently being shown or highlighted
  const helpInfoStates = ref<Record<HelpInfoId, { shown: boolean; highlighted: boolean }>>({
    [negativeValuesHelpInfoId]: { shown: false, highlighted: false },
    [logScaleHelpInfoId]: { shown: false, highlighted: false },
  });

  // Track how many times each help info has been shown this session
  const helpInfoShowCounts = ref<Record<HelpInfoId, number>>({
    [negativeValuesHelpInfoId]: 0,
    [logScaleHelpInfoId]: 0,
  });

  // Track how many times each help info has been highlighted this session
  const helpInfoHighlightCounts = ref<Record<HelpInfoId, number>>({
    [negativeValuesHelpInfoId]: 0,
    [logScaleHelpInfoId]: 0,
  });

  const showTimeouts = ref<Record<HelpInfoId, ReturnType<typeof setTimeout> | undefined>>({
    [negativeValuesHelpInfoId]: undefined,
    [logScaleHelpInfoId]: undefined,
  });

  const isShown = (helpInfoId: HelpInfoId) => {
    return helpInfoStates.value[helpInfoId].shown;
  }

  const isHighlighted = (helpInfoId: HelpInfoId) => {
    return helpInfoStates.value[helpInfoId].highlighted;
  };

  const show = (helpInfoId: HelpInfoId, delayMs: number = 0) => {
    clearTimeout(showTimeouts.value[helpInfoId]);
    if (!isShown(helpInfoId)) {
      showTimeouts.value[helpInfoId] = setTimeout(() => {
        helpInfoStates.value[helpInfoId].shown = true;
        helpInfoShowCounts.value[helpInfoId] += 1;
      }, delayMs);
    }
  };

  const unShow = (helpInfoId: HelpInfoId) => {
    clearTimeout(showTimeouts.value[helpInfoId]);
    helpInfoStates.value[helpInfoId].shown = false;
  };

  // Apply a highlight only if the help info has not been highlighted before
  const highlightOnce = (helpInfoId: HelpInfoId) => {
    const { highlighted, shown } = helpInfoStates.value[helpInfoId];
    if (!highlighted && shown && helpInfoHighlightCounts.value[helpInfoId] === 0) {
      helpInfoStates.value[helpInfoId].highlighted = true;
      helpInfoHighlightCounts.value[helpInfoId] += 1;
      setTimeout(() => {
        helpInfoStates.value[helpInfoId].highlighted = false;
      }, 2000);
    }
  };

  watch(() => appStore.logScaleEnabled, (logScaleEnabled) => {
    if (logScaleEnabled) {
      show(logScaleHelpInfoId)
    } else {
      unShow(logScaleHelpInfoId);
    };
  }, { immediate: true });

  return {
    enableFocusTraps,
    helpInfoHighlightCounts,
    helpInfoShowCounts,
    helpInfoStates,
    highlightOnce,
    isHighlighted,
    isShown,
    show,
    unShow,
  };
});
