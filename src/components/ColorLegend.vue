<template>
  <div
    v-if="colors && colors.length >= 2"
    class="max-w-full h-full"
    id="colorLegend"
  >
    <h3 class="fs-3 font-medium mb-5 text-heading mb-2">
      Legend
    </h3>
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
import { getOrderedYCategoricalScale } from '@/composables/useCategoricalScaleOrdering';

const appStore = useAppStore();
const colorStore = useColorStore();

const colors = computed(() => {
  const { colorDimension } = colorStore;
  
  // When color dimension matches row dimension, use mean-based ordering
  if (colorDimension === appStore.dimensions[Axis.ROW]) {
    try {
      const orderedScale = getOrderedYCategoricalScale(
        colorDimension,
        colorStore.currentLines
      );
      // Filter to only values that are in the color mapping and maintain the ordered scale
      const orderedColors = orderedScale
        .filter(value => colorStore.colorMapping.has(value))
        .map(value => [value, colorStore.colorMapping.get(value)!] as [string, HEX]);
      
      // Only use ordered colors if we got results, otherwise fall through to default behavior
      if (orderedColors.length > 0) {
        return orderedColors;
      }
    } catch (error) {
      // If ordering fails (e.g., missing data), fall back to existing behavior
      console.warn('Failed to order color legend by mean values, using fallback ordering:', error);
    }
  }
  
  // Location dimension special case: Sort by geographical resolution
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
  
  // Default: reverse the color mapping order
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
