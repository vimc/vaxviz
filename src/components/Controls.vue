<template>
  <form class="m-5 flex gap-x-20 gap-y-5 flex-wrap">
    <fieldset class="gap-5" aria-required="true">
      <legend class="block mb-5 font-medium text-heading">Burden metric:</legend>
      <div>
        <FwbRadio
          v-for="({ label, value }) in appStore.metricOptions"
          :key="value"
          v-model="appStore.burdenMetric"
          name="burdenMetric"
          :label="label"
          :value="value"
          class="mb-1"
        />
      </div>
    </fieldset>
    <fieldset class="gap-5" aria-required="true">
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
    <div class="mb-5 grow min-w-75 max-w-100">
      <label id="focusLabel" for="focus" class="block mb-5 font-medium text-heading">
        Focus {{ appStore.exploreByLabel.toLocaleLowerCase() }}:
      </label>
      <VueSelect
        v-model="appStore.focus"
        :isClearable="false"
        :options="selectOptions"
        :filter-by="(option, label, search) => label.toLowerCase().includes(search.toLowerCase()) || option.value === 'optgroup'"
        :aria="{ labelledby: 'focusLabel' }"
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
    <FwbCheckbox v-model="appStore.useLogScale" label="Log scale" :wrapper-class="'self-center'"/>
    <FwbCheckbox v-model="appStore.splitByActivityType" label="Split by activity type" :wrapper-class="'self-center'"/>
  </form>
</template>

<script setup lang="ts">
import { FwbCheckbox, FwbRadio } from 'flowbite-vue'
import VueSelect from "vue3-select-component";
import { computed } from 'vue';
import { useAppStore } from '../stores/appStore';
import { Dimensions, LocResolutions } from '@/types';

const appStore = useAppStore();

const geographySelectOptions = computed(() => {
  const options = [{
    label: "Global",
    options: [
      { label: `All ${appStore.countryOptions.length} VIMC countries`, value: LocResolutions.GLOBAL as string }
    ]
  }];
  if (appStore.subregionOptions.length > 0) {
    options.push({
      label: "Subregions",
      options: appStore.subregionOptions
    });
  }
  if (appStore.countryOptions.length > 0) {
    options.push({
      label: "Countries",
      options: appStore.countryOptions
    });
  }
  return options;
});

const selectOptions = computed(() => {
  if (appStore.exploreBy === Dimensions.LOCATION) {
    return geographySelectOptions.value.map(group => {
      const optgroup = { label: group.label, value: "optgroup", disabled: true };
      return [optgroup, ...group.options];
    }).flat();
  } else if (appStore.exploreBy === Dimensions.DISEASE) {
    return appStore.diseaseOptions;
  }
  return [];
});
</script>

<style lang="css" scoped>
.d-flex .col-form-label {
  width: 150px;
}

:deep(.disabled-text-color) {
  color: var(--vs-option-disabled-text-color);
}
</style>
