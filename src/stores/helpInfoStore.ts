import { defineStore } from "pinia";
import { ref, watch } from "vue";

// jsdom is incompatible with focus-trap, so disable focus-traps in tests
const appMode = import.meta.env.MODE;
// focus-trap is an accessibility feature for modal dialogs
const enableFocusTraps = appMode !== 'test';

export const useHelpInfoStore = defineStore("helpInfo", () => {
  const showNegativeValuesHelpInfo = ref(false);
  const negativeValueHelpMessageIsHighlighted = ref(false);

  // Track how many times the negative help info has been shown this session
  const negativeHelpInfoShowCount = ref(0);
  watch(showNegativeValuesHelpInfo, (show) => {
    if (show) {
      negativeHelpInfoShowCount.value++;
    }
  });

  // Track how many times the negative help info has been highlighted this session
  const negativeHelpInfoHighlightCount = ref(0);
  watch(negativeValueHelpMessageIsHighlighted, (highlight) => {
    if (highlight) {
      negativeHelpInfoHighlightCount.value++;
    }
  });

  const applyHighlightingToNegativeHelpInfo = () => {
    if (showNegativeValuesHelpInfo.value && !negativeValueHelpMessageIsHighlighted.value) {
      negativeValueHelpMessageIsHighlighted.value = true;
      setTimeout(() => {
        negativeValueHelpMessageIsHighlighted.value = false;
      }, 2000);
    }
  }

  return {
    applyHighlightingToNegativeHelpInfo,
    showNegativeValuesHelpInfo,
    enableFocusTraps,
    negativeValueHelpMessageIsHighlighted,
    negativeHelpInfoShowCount,
    negativeHelpInfoHighlightCount,
  };
});
