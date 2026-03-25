<template>
  <HelpInfoModal
    v-if="helpInfoStore.showNegativeValuesHelpInfo"
    id="negativeEstimates"
    alert-text="Some estimates are negative – this is expected."
    header="Negative estimates"
  >
    <template #body>
      <div id="negativeEstimatesBody" class="space-y-5">
        <p class="mb-3">Negative estimates can occur for a few reasons, including stochastic variation and rounding errors.</p>
        <details class="space-y-5">
          <summary class="ps-2">
            <span class="ps-1 underline cursor-pointer">More info</span>
          </summary>
          <p>Due to stochastic variation and the accumulation of rounding differences, some negative impacts arise. For example, although the same random seed is used per stochastic run, there may be some cases where there are stochastic differences between the no vaccination and with-vaccination scenarios for the same stochastic run which can lead to small negative vaccine impacts.</p>
          <p>Similarly, rounding errors, due to estimating burden with a high number of decimal places, can accumulate over age groups, years and countries to lead to small differences and thus negative impact.</p>
          <p>Finally, in some cases, negative impact is a known result of some of the more artificial vaccination scenarios: specifically, we model an intermediate scenario for rubella with only one vaccine activity (a strategy that would never be implemented) in order to calculate the incremental benefit of each vaccination activity. Sub-optimal rubella vaccination coverage will lead to an increase in the mean age of infection but not give sufficient protection to the wider population. As a result, the mean age at infection may occur in people of child-bearing age, increasing the incidence of Congenital Rubella Syndrome. By implementing vaccination with suitable coverage using both campaigns covering several age bands and routine vaccination, this negative impact is avoided.</p>
        </details>
      </div>
    </template>
  </HelpInfoModal>
  <HelpInfoModal
    v-else-if="appStore.logScaleEnabled"
    id="logScale"
    alert-text="Note: you are viewing estimates on a log 10 scale"
    header="Log 10 scale"
  >
    <template #body>
      <p>This means that estimates that differ by orders of magnitude can be shown together. Please be aware the x-axis is non-linear and if you toggle between linear and log scales, the bins may change.</p>
    </template>
  </HelpInfoModal>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/appStore';
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import HelpInfoModal from '@/components/HelpInfoModal.vue';

const helpInfoStore = useHelpInfoStore();
const appStore = useAppStore();
</script>
