<template>
  <div
    v-if="colors && colors.length >= 2"
    class="h-20 flex mb-5 w-fit m-auto"
    id="colorLegend"
  >
    <h3 class="fs-3 font-medium text-heading mr-10 self-center">
      Legend
    </h3>
    <ul class="flex flex-col gap-y-1 flex-wrap max-h-full min-h-0">
      <li
        v-for="([value, color]) in colors"
        :key="value"
        class="flex gap-x-2 text-sm mr-20"
      >
        <span
          class="legend-color-box"
          :style="colorBoxStyle(color)"
        />
        <span class="legend-label">
          {{ dimensionOptionLabel(colorStore.colorDimension, value) }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type HEX } from "color-convert";
import { useColorStore } from '@/stores/colorStore';
import { dimensionOptionLabel } from '@/utils/options';
import { useAppStore } from '@/stores/appStore';
import { Axis, Dimension, LocResolution } from '@/types';

const appStore = useAppStore();
const colorStore = useColorStore();

const colors = computed(() => {
  const { colorDimension } = colorStore;
  if (colorDimension === appStore.dimensions[Axis.WITHIN_BAND] && colorDimension === Dimension.LOCATION) {

    // Sort by the geographical resolution (LocResolution) of the values.
    return Array.from(colorStore.colorMapping).sort(([aVal], [bVal]) => {
      const [aLocRes, bLocRes] = [
        appStore.geographicalResolutionForLocation(aVal),
        appStore.geographicalResolutionForLocation(bVal)
      ];
      const [aRank, bRank] = [
        aLocRes ? Object.values(LocResolution).indexOf(aLocRes) : -1,
        bLocRes ? Object.values(LocResolution).indexOf(bLocRes) : -1,
      ];
      return bRank - aRank;
    });
  }
  // TODO: (vimc-9191) a less hacky way of getting the same ordering on the legend as on the plot (this way doesn't work for persisted mappings like global)
  return Array.from(colorStore.colorMapping).toReversed();
})

const colorBoxStyle = (color: HEX) => {
  const { fillColor, strokeColor } = colorStore.colorProperties(color);
  return {
    backgroundColor: fillColor,
    borderColor: strokeColor,
  }
}
</script>

<style scoped>
.legend-color-box {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  border-width: 2px;
  border-style: solid;
}

.legend-label {
  line-height: 1rem;
  margin-top: 1px;
  word-wrap: normal;
}
</style>
