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
  </div>
</template>

<script setup lang="ts">
import { FwbCheckbox, FwbRadio } from 'flowbite-vue'
import { useAppStore } from '@/stores/appStore';
import DownloadButton from '@/components/DownloadButton.vue';
import { metricOptions } from '@/utils/options';
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import FocusSelect from './FocusSelect.vue';

const appStore = useAppStore();
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
