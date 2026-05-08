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
    <div class="flex gap-y-5 flex-wrap flex-col w-fit">
      <FwbToggle
        v-model="appStore.splitByActivityType"
        label="Split by activity type"
        size="sm"
      />
      <FwbToggle
        v-model="appStore.logScaleEnabled"
        label="Log scale"
        size="sm"
      />
      <div class="flex gap-3 items-center">
        <FwbToggle
          v-model="appStore.normalizeYScale"
          label="Normalize y-axis scales"
          size="sm"
        />
        <HelpInfo
          header="Y-axis normalization"
        >
          <template #body>
            <div class="space-y-5">
              <p>
                The y-axis for each plot row is the run count: that is, number of model runs that fall within a certain range of impact estimates (on the x-axis).
                When the y-axis values are normalized, the scales are zoomed in in order to make the most use of available vertical space.
                This means that, as long as normalizing is enabled, y-axis values are not comparable across rows (nor between traces that share a row).
              </p>
              <p>
                Normalizing the y-axis scales is especially useful when ridgelines have very variable shapes, e.g. some having tall spikes, others very flat: in such cases it makes the shapes of the ridgelines easier to read.
              </p>
            </div>
          </template>
        </HelpInfo>
      </div>
    </div>
    <DownloadModal />
  </div>
</template>

<script setup lang="ts">
import { FwbRadio, FwbToggle } from 'flowbite-vue'
import { useAppStore } from '@/stores/appStore';
import DownloadModal from '@/components/DownloadModal.vue';
import { metricOptions } from '@/utils/options';
import FocusSelect from './FocusSelect.vue';
import HelpInfo from './HelpInfo.vue';

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
