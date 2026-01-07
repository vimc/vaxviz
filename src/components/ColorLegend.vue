<template>
  <div
    v-if="colors && colors.length >= 2"
    class="max-w-full h-full"
    id="colorLegend"
  >
    <h3 class="fs-3 font-medium mb-5 text-heading mb-2">
      Legend
    </h3>
    <ul class="flex flex-col flex-wrap gap-y-1 max-h-full max-w-full">
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
import convert, { type HEX } from "color-convert";
import { useColorStore } from '@/stores/colorStore';
import { dimensionOptionLabel } from '@/utils/options';

const colorStore = useColorStore();

const colors = computed(() => {
  // TODO: (vimc-9191) a less hacky way of getting the same ordering on the legend as on the plot (this way doesn't work for persisted mappings like global)
  return Array.from(colorStore.colorMapping).toReversed();
})

const colorBoxStyle = (color: HEX) => {
  const { fillColor, fillOpacity, strokeColor } = colorStore.colorPropertiesForFillColor(color);
  const fillRgb = fillColor ? convert.hex.rgb(fillColor) : [0, 0, 0];
  return {
    backgroundColor: `rgba(${fillRgb[0]}, ${fillRgb[1]}, ${fillRgb[2]}, ${fillOpacity})`,
    borderColor: strokeColor,
  }
}
</script>

<style scoped>
.legend-color-box {
  min-width: 1rem;
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
