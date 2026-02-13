<template>
  <div class="m-5 flex gap-y-15 flex-col w-fit">
    <div>
      <fieldset class="gap-5 mb-3 w-fit" aria-required="true">
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
        <FocusSelect />
      </div>
    </div>
    <fieldset class="gap-5 w-fit" aria-required="true">
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
    <div class="flex gap-y-5 flex-wrap flex-col w-fit">
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
    <DownloadButton />
    <HelpInfoModalButton
      v-if="helpInfoStore.showNegativeValuesHelpInfo"
      header="Noticing negative estimates?"
    >
      <template #body>
        <div id="negativeEstimatesBody" class="space-y-5">
          <p class="mb-3">These can occur for a few reasons:</p>
          <ul class="space-y-1 list-disc list-inside">
            <li>Stochastic variation</li>
            <li>Rounding errors</li>
            <li>Artificial vaccination scenarios, included for calculation purposes</li>
          </ul>
          <details class="ps-5 space-y-5">
            <summary>
              <span class="ps-1 underline cursor-pointer">More info</span>
            </summary>
            <p>Due to stochastic variation and the accumulation of rounding differences, some negative impacts arise. For example, although the same random seed is used per stochastic run, there may be some cases where there are stochastic differences between the no vaccination and with-vaccination scenarios for the same stochastic run which can lead to small negative vaccine impacts.</p>
            <p>Similarly, rounding errors due to estimating burden with a high number of decimal places, can accumulate over age groups, years and countries to lead to small differences and thus negative impact.</p>
            <p>Finally, in some cases, negative impact is a known result of some of the more artificial vaccination scenarios: specifically, we model an intermediate scenario for rubella with only one vaccine activity (a strategy that would never be implemented) in order to calculate the incremental benefit of each vaccination activity. Sub-optimal rubella vaccination coverage will lead to an increase in the mean age of infection but not give sufficient protection to the wider population. As a result, the mean age at infection may occur in people of child-bearing age, increasing the incidence of Congenital Rubella Syndrome. By implementing vaccination with suitable coverage using both campaigns covering several age bands and routine vaccination, this negative impact is avoided.</p>
          </details>
        </div>
      </template>
    </HelpInfoModalButton>
    <HelpInfoModalButton
      v-else-if="appStore.logScaleEnabled"
      header="Note: you are viewing estimates on a log 10 scale"
    >
      <template #body>
        <p>This means that estimates that differ by orders of magnitude can be shown together. Please be aware the x-axis is non-linear and if you toggle between linear and log scales, the bins may change.</p>
      </template>
    </HelpInfoModalButton>
  </div>
</template>

<script setup lang="ts">
import { FwbCheckbox, FwbRadio } from 'flowbite-vue'
import { useAppStore } from '@/stores/appStore';
import DownloadButton from '@/components/DownloadButton.vue';
import HelpInfoModalButton from '@/components/HelpInfoModalButton.vue';
import { metricOptions } from '@/utils/options';
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import FocusSelect from './FocusSelect.vue';

const appStore = useAppStore();
const helpInfoStore = useHelpInfoStore();
</script>

<style lang="css" scoped>
.d-flex .col-form-label {
  width: 150px;
}

:deep(#negativeEstimatesBody) {
  details:first-of-type summary::marker, :is(::-webkit-details-marker) {
    content: "+";
  }

  details[open]:first-of-type summary::marker {
    content: "−";
  }
}
</style>
