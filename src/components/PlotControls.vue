<template>
  <form class="m-5 flex gap-y-15 flex-wrap flex-col w-fit">
    <div>
      <fieldset class="gap-5 mb-3" aria-required="true">
        <legend class="block mb-5 font-medium text-heading">Focus on:</legend>
        <div>
          <FwbRadio
            v-for="({ label, value }) in appStore.exploreOptions"
            :key="value"
            v-model="appStore.exploreBy"
            name="exploreBy"
            :label="label"
            :value="value"
            class="mb-1"
          />
        </div>
      </fieldset>
      <div class="w-75">
        <label id="focusLabel" for="focus" class="sr-only">
          Focus {{ appStore.exploreByLabel }}
        </label>
        <VueSelect
          v-if="focusIsMultiSelect"
          v-model="appStore.focus"
          :hide-selected-options="false"
          :is-clearable="appStore.focus.length > 1"
          :options="selectOptions"
          :filter-by="selectFilterBy"
          :aria="{ labelledby: 'focusLabel' }"
          :is-multi="true"
          :select-on-blur="false"
        >
          <template #menu-header>
            <div class="p-2 ps-3 disabled-text-color">
              <h3 class="text-sm">Start typing to filter the list...</h3>
            </div>
          </template>
          <template #option="{ option }">
            <h4 v-if="option.value === 'optgroup'" class="font-medium text-sm text-heading disabled-text-color">{{ option.label }}</h4>
            <span v-else class="ps-2">{{ option.label }}</span>
          </template>
        </VueSelect>

        <VueSelect
          v-else
          v-model="singletonFocus"
          :hide-selected-options="false"
          :is-clearable="false"
          :options="selectOptions"
          :filter-by="selectFilterBy"
          :aria="{ labelledby: 'focusLabel' }"
          :is-multi="false"
          :select-on-blur="true"
        >
          <template #menu-header>
            <div class="p-2 ps-3 disabled-text-color">
              <h3 class="text-sm">Start typing to filter the list...</h3>
            </div>
          </template>
          <template #option="{ option }">
            <h4 v-if="option.value === 'optgroup'" class="font-medium text-sm text-heading disabled-text-color">{{ option.label }}</h4>
            <span v-else class="ps-2">{{ option.label }}</span>
          </template>
        </VueSelect>
      </div>
      <div class="mt-1">
        <FwbCheckbox
          v-model="focusIsMultiSelect"
          label="Allow multiple focus selections"
          :wrapper-class="'w-fit'"
        />
      </div>
    </div>
    <fieldset class="gap-5" aria-required="true">
      <legend class="block mb-5 font-medium text-heading">Burden metric:</legend>
      <div>
        <FwbRadio
          v-for="({ label, value }) in metricOptions"
          :key="value"
          v-model="appStore.burdenMetric"
          name="burdenMetric"
          :label="label"
          :value="value"
          class="mb-1"
        />
      </div>
    </fieldset>
    <!-- TODO?: Disable this checkbox if the currently selected disease does not have multiple activity types? -->
    <div class="flex gap-y-5 flex-wrap flex-col">
      <FwbCheckbox
        v-model="appStore.splitByActivityType"
        label="Split by activity type"
        :wrapper-class="'w-fit'"
      />
      <FwbCheckbox
        v-model="appStore.logScaleEnabled"
        label="Log scale"
        :wrapper-class="'w-fit'"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { FwbCheckbox, FwbRadio } from 'flowbite-vue'
import VueSelect, { type Option } from "vue3-select-component";
import { computed, ref, watch } from 'vue';
import { useAppStore } from '../stores/appStore';
import { Dimensions } from '@/types';
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import { globalOption, metricOptions } from '@/utils/options';

const appStore = useAppStore();

const focusIsMultiSelect = ref(appStore.focus.length > 1);
// For single-select mode, we need a separate ref to bind to the select component.
const singletonFocus = ref(appStore.focus[0]);

watch(() => appStore.focus, (newFocus) => singletonFocus.value = newFocus[0]);

watch(singletonFocus, (newVal) => {
  if (newVal && !focusIsMultiSelect.value) {
    appStore.focus = [newVal];
  }
});

watch(focusIsMultiSelect, (multi) => {
  if (multi) {
    appStore.focus = singletonFocus.value ? [singletonFocus.value] : [];
  } else {
    singletonFocus.value = appStore.focus[0];
    appStore.focus = appStore.focus.slice(0, 1);
  }
});

const selectOptions = computed(() => {
  if (appStore.exploreBy === Dimensions.LOCATION) {
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
  } else if (appStore.exploreBy === Dimensions.DISEASE) {
    return diseaseOptions;
  }
  return [];
});

const selectFilterBy = (option: Option<string>, label: string, search: string) => {
  return label.toLowerCase().includes(search.toLowerCase()) || option.value === 'optgroup';
};
</script>

<style lang="css" scoped>
.d-flex .col-form-label {
  width: 150px;
}

:deep(.disabled-text-color) {
  color: var(--vs-option-disabled-text-color);
}
</style>
