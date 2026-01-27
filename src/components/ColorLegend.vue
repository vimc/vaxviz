<template>
  <div
    v-if="colors && colors.length >= 2"
    class="max-w-full h-full"
    id="colorLegend"
    role="region"
    aria-labelledby="legend-heading"
  >
    <h2 id="legend-heading" class="fs-3 font-medium mb-5 text-heading mb-2">
      Legend
    </h2>
    <ul class="flex flex-col gap-y-1 max-h-full max-w-full">
      <li
        v-for="([value, color]) in colors"
        :key="value"
        class="flex gap-x-2 text-sm"
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
  const colorsMap = Array.from(colorStore.colorMapping);
  if (colorDimension === appStore.dimensions[Axis.WITHIN_BAND] && colorDimension === Dimension.LOCATION) {

    // Sort by the geographical resolution (LocResolution) of the values.
    return colorsMap.sort(([aVal], [bVal]) => {
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
  // Maintain the order of colors as in the plot-rows; the plot rows start from the bottom, so we reverse.
  return colorsMap.toReversed();
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
