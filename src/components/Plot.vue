<template>
  <p>Data rows: {{ histData.length }}</p>
  <p>Column axis: <span>{{ dimensionInfo(appStore.dimensions.x) }}</span></p>
  <p>Row axis: <span>{{ dimensionInfo(appStore.dimensions.y) }}</span></p>
  <p>Within-band axis: <span>{{ dimensionInfo(appStore.dimensions.withinBand) }}</span></p>
</template>

<script setup lang="ts">
import useData from '@/composables/useData';
import { useAppStore } from '@/stores/appStore';
import { Dimensions } from '@/types';

const appStore = useAppStore();

const { geographicalResolutions, histData } = useData();

const dimensionInfo = (dimension: Dimensions | null) => {
  if (dimension === Dimensions.LOCATION) {
    return `${dimension} (${geographicalResolutions.value.join(", ")})`;
  } else {
    return dimension ?? "none";
  }
};
</script>

<style lang="css" scoped>
span {
  margin-left: 5rem;
}
</style>
