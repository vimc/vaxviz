<template>
  <div
    id="chartWrapper"
    class="m-50"
    :data-test="JSON.stringify({
      histogramDataRowCount: dataStore.histogramData.length,
      x: appStore.dimensions.x,
      y: appStore.dimensions.y,
      withinBand: appStore.dimensions.withinBand,
    })"
  >
    <h3 class="font-bold text-lg">If a plot were plotted, it would have:</h3>
    <p :key="key" v-for="(value, key) in appStore.dimensions">{{ key }} axis: {{ value ?? "none" }}</p>
    <p v-if="Object.values(appStore.dimensions).includes(Dimensions.LOCATION)" class="mt-5">
      Location resolutions in use: {{ dataStore.geographicalResolutions.join(", ") }}
    </p>
    <p class="mt-5">Data rows: {{ dataStore.histogramData.length }}</p>
    <p class="mt-5">Errors: {{ dataStore.fetchErrors }}</p>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '@/stores/dataStore';
import { useAppStore } from '@/stores/appStore';
import { Dimensions } from '@/types';

const appStore = useAppStore();
const dataStore = useDataStore();
</script>

<style lang="css" scoped>
span {
  margin-left: 5rem;
}
</style>
