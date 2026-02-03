<template>
  <div class="m-5 flex gap-y-15 flex-wrap flex-col w-fit">
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
          v-model="appStore.focus"
          :isClearable="false"
          :options="selectOptions"
          :filter-by="selectFilterBy"
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
    <HelpInfoModalButton
      v-if="helpInfoStore.showNegativeValuesHelpInfo"
      header="Noticing negative estimates?"
      :paragraphs="[
        'These can occur for a few reasons:',
        'Due to stochastic variation and the accumulation of rounding differences, some negative impacts arise. For example, although the same random seed is used per stochastic run, there may be some cases where there are stochastic differences between the no vaccination and with-vaccination scenarios for the same stochastic run which can lead to small negative vaccine impacts.',
        'Similarly, rounding errors due to estimating burden with a high number of decimal places, can accumulate over age groups, years and countries to lead to small differences and thus negative impact.',
        'Finally, in some cases, negative impact is a known result of some of the more artificial vaccination scenarios: specifically, we model an intermediate scenario for rubella with only one vaccine activity (a strategy that would never be implemented) in order to calculate the incremental benefit of each vaccination activity. Sub-optimal rubella vaccination coverage will lead to an increase in the mean age of infection but not give sufficient protection to the wider population. As a result, the mean age at infection may occur in people of child-bearing age, increasing the incidence of Congenital Rubella Syndrome. By implementing vaccination with suitable coverage using both campaigns covering several age bands and routine vaccination, this negative impact is avoided.',
      ]"
    />
    <HelpInfoModalButton
      v-else-if="appStore.logScaleEnabled"
      header="Note: you are viewing estimates on a log 10 scale"
      :paragraphs="[
        'This means that estimates that differ by orders of magnitude can be shown together. Please be aware the x-axis is non-linear and if you toggle between linear and log scales, the bins may change.',
      ]"
    />
  </div>
</template>

<script setup lang="ts">
import { FwbCheckbox, FwbRadio } from 'flowbite-vue'
import VueSelect, { type Option } from "vue3-select-component";
import { computed } from 'vue';
import { useAppStore } from '@/stores/appStore';
import { Dimension } from '@/types';
import HelpInfoModalButton from '@/components/HelpInfoModalButton.vue';
import countryOptions from '@/data/options/countryOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import { globalOption, metricOptions } from '@/utils/options';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const appStore = useAppStore();
const helpInfoStore = useHelpInfoStore();

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
