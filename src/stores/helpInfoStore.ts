import { defineStore } from "pinia";
import { ref } from "vue";

// jsdom is incompatible with focus-trap, so disable focus-traps in tests
const appMode = import.meta.env.MODE;
// focus-trap is an accessibility feature for modal dialogs
const enableFocusTraps = appMode !== 'test';

export const useHelpInfoStore = defineStore("helpInfo", () => {
  const showNegativeValuesHelpInfo = ref(false);

  return { showNegativeValuesHelpInfo, enableFocusTraps };
});
