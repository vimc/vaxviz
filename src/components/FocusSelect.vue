<template>
  <label id="focusLabel" for="focus" class="sr-only">
    Focus {{ appStore.exploreByLabel }}
  </label>
  <VueSelect
    v-model="focusModel"
    :is-multi="multiFocusMode"
    :is-clearable="false"
    :hide-selected-options="false"
    :options="selectOptions"
    :filter-by="(option: Option<string>, label: string, search: string) =>
      label.toLowerCase().includes(search.toLowerCase()) && option.value !== 'optgroup'
    "
    :aria="{ labelledby: 'focusLabel' }"
  >
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
      :wrapper-class="'w-fit'"
    />
  </div>
</template>

<script setup lang="ts">
import { FwbCheckbox } from 'flowbite-vue'
import VueSelect, { type Option } from "vue3-select-component";
import { computed, ref, watch } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { Dimension } from '@/types';
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import { globalOption } from '@/utils/options';

const appStore = useAppStore();

const multiFocusMode = ref(appStore.focuses.length > 1);

const focusModel = computed({
  get: () => multiFocusMode.value ? appStore.focuses : appStore.focuses[0],
  set: (val: string | string[]) => {
    appStore.focuses = Array.isArray(val) ? val : [val];
  }
});

const selectOptions = computed(() => {
  if (appStore.exploreBy === Dimension.LOCATION) {
    return [{
      label: "Global",
      options: [globalOption]
    }, {
      label: "Subregions",
      options: subregionOptions
    }, {
      label: "Countries",
      options: countryOptions
    }].map(group => {
      const optgroup = { label: group.label, value: "optgroup", disabled: true };
      return [optgroup, ...group.options];
    }).flat();
  } else {
    return diseaseOptions;
  }
});

watch(multiFocusMode, (multi) => {
  if (!multi && appStore.focuses.length === 0) {
    appStore.resetFocuses();
  } else if (!multi && appStore.focuses.length > 1) {
    // If multiple focuses are currently selected, keep the first one and deselect the rest.
    appStore.focuses = appStore.focuses.slice(0, 1);
  }
});
</script>

<style lang="css" scoped>
:deep(.disabled-text-color) {
  color: var(--vs-option-disabled-text-color);
}
</style>
