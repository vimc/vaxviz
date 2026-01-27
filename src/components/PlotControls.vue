<template>
  <form class="m-5 flex gap-y-15 flex-wrap flex-col w-fit" aria-label="Visualization controls">
    <div>
      <fieldset class="gap-5 mb-3">
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
          id="focus"
          v-model="appStore.focus"
          :isClearable="false"
          :options="selectOptions"
          :filter-by="selectFilterBy"
          :aria-labelledby="'focusLabel'"
        >
          <template #menu-header>
            <div class="p-2 ps-3 disabled-text-color" role="presentation">
              <p class="text-sm">Start typing to filter the list...</p>
            </div>
          </template>
          <template #option="{ option }">
            <strong v-if="option.value === 'optgroup'" class="font-medium text-sm text-heading disabled-text-color" role="presentation">{{ option.label }}</strong>
            <span v-else class="ps-2">{{ option.label }}</span>
          </template>
        </VueSelect>
      </div>
    </div>
    <fieldset class="gap-5">
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
    <!-- TODO?: Disable this checkbox, or warn user, if the currently selected disease does not have multiple activity types? -->
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
import { computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { Dimension } from '@/types';
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import { globalOption, metricOptions } from '@/utils/options';

const appStore = useAppStore();

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
  } else if (appStore.exploreBy === Dimension.DISEASE) {
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
