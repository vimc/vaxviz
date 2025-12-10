<template>
  <div
    id="chartWrapper"
    class="m-50"
    :data-test="JSON.stringify({
      histogramDataRowCount: histogramData.length,
      x: appStore.dimensions.x,
      y: appStore.dimensions.y,
      withinBand: appStore.dimensions.withinBand,
    })"
  >
    <h3 class="font-bold text-lg">If a plot were plotted, it would have:</h3>
    <p :key="key" v-for="(value, key) in appStore.dimensions">{{ key }} axis: {{ value ?? "none" }}</p>
    <p v-if="Object.values(appStore.dimensions).includes(Dimensions.LOCATION)" class="mt-5">
      Location resolutions in use: {{ geographicalResolutions.join(", ") }}
    </p>
    <p class="mt-5">Data rows: {{ histogramData.length }}</p>
    <p class="mt-5">Errors: {{ fetchErrors }}</p>
  </div>
</template>

<script setup lang="ts">
import useData from '@/composables/useData';
import { useAppStore } from '@/stores/appStore';
import { Dimensions } from '@/types';
import { watch } from 'vue';

const appStore = useAppStore();

const { fetchErrors, geographicalResolutions, histogramData, preemptiveLoad } = useData();

const largestDataFilesInSizeOrder = [
  "hist_counts_deaths_disease_activity_type_country_log.json", // 19.6MB
  "hist_counts_dalys_disease_activity_type_country_log.json", // 19.4MB
  "hist_counts_dalys_disease_activity_type_country.json", // 18.3MB
  "hist_counts_deaths_disease_activity_type_country.json", // 17.9MB
  "hist_counts_deaths_disease_country_log.json", // 9.7MB
  "hist_counts_dalys_disease_country_log.json", // 9.5MB
  "hist_counts_dalys_disease_country.json", // 8.7MB
  "hist_counts_deaths_disease_country.json", // 8.7MB
  // Next largest file is 3.6MB, so we stop here.
]

watch(histogramData, () => {
  // Once the first user-requested data has loaded (histogramData),
  // start preemptive loading of the largest data files.
  // Don't await: this should be a background process, not block anything.
  preemptiveLoad(largestDataFilesInSizeOrder)
});
</script>

<style lang="css" scoped>
span {
  margin-left: 5rem;
}
</style>
