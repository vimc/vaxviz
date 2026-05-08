<template>
  <label id="focusLabel" class="sr-only">
    Focus {{ appStore.exploreByLabel }}
  </label>
  <VueSelect
    v-model="focusModel"
    :is-multi="multiFocusMode"
    :is-clearable="multiFocusMode && appStore.focuses.length > 1"
    :hide-selected-options="false"
    :options="selectOptions"
    :filter-by="(option: Option<string>, label: string, search: string) =>
      label.toLowerCase().includes(search.toLowerCase()) && option.value !== 'optgroup'
    "
    :aria="{ labelledby: 'focusLabel' }"
  >
    <template #placeholder>
      <span class="text-sm">Select {{ appStore.exploreBy }}(s) to focus on</span>
    </template>
    <template #menu-header>
      <div class="p-2 ps-3 disabled-text-color">
        <p class="text-sm">Start typing to filter the list...</p>
      </div>
    </template>
    <template #option="{ option }">
      <p
        v-if="option.value === 'optgroup'"
        class="font-medium text-sm text-heading disabled-text-color">
        {{ option.label }}
      </p>
      <span v-else class="ps-2">{{ option.label }}</span>
    </template>
  </VueSelect>
  <div class="mt-1">
    <FwbCheckbox
      v-model="multiFocusMode"
      label="Allow multiple focus selections"
      :wrapper-class="'w-fit mt-2'"
      :label-class="'font-normal'"
    />
  </div>
</template>

<script setup lang="ts">
import { FwbCheckbox } from 'flowbite-vue'
import VueSelect, { type Option } from "vue3-select-component";
import { computed, ref, watch } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { Dimension } from '@/types';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { locationSelectOptions } from '@/utils/options';

const appStore = useAppStore();

const multiFocusMode = ref(false);

const focusModel = computed({
  get: () => multiFocusMode.value ? appStore.focuses : appStore.focuses[0],
  set: (val: string | string[]) => {
    appStore.focuses = Array.isArray(val) ? val : [val];
  }
});

const selectOptions = computed(() =>
  appStore.exploreBy === Dimension.LOCATION ? locationSelectOptions : diseaseOptions
);

watch(multiFocusMode, (multi) => {
  if (!multi && appStore.focuses.length === 0) {
    appStore.resetFocuses();
  } else if (!multi && appStore.focuses.length > 1) {
    // If multiple focuses are currently selected, keep the first one and deselect the rest.
    appStore.focuses = appStore.focuses.slice(0, 1);
  }
});
</script>

<style lang="scss" scoped>
:deep(.disabled-text-color) {
  color: var(--vs-option-disabled-text-color);
}
</style>
