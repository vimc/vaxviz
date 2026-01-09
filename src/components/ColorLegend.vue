<template>
  <div
    v-if="colors && colors.length >= 2"
    class="max-w-full h-full"
    id="colorLegend"
  >
    <h3 class="fs-3 font-medium mb-5 text-heading mb-2">
      {{ exploreOptions.find(o => o.value === colorStore.colorDimension)?.pluralLabel }}
    </h3>
    <ul class="flex flex-col gap-y-1 max-h-full max-w-full">
      <li
        v-for="([value, color]) in colors"
        :key="value"
      >
        <button
          type="button"
          class="legend-button flex gap-x-2 cursor-pointer"
          :class="{
            'filtered-by-legend': isFilteredByLegend(value),
          }"
          @click="handleClick(value)"
          @mouseover="appStore.hoveredValue = value"
          @mouseleave="appStore.hoveredValue = null"
        >
          <div class="flex gap-x-2 items-center text-sm">
            <span
              class="legend-color-box"
              :style="colorBoxStyle(color)"
            />
            <span class="legend-label">
              {{ dimensionOptionLabel(colorStore.colorDimension, value) }}
            </span>
          </div>
          <span class="text-xs text-gray-500 ms-auto close-button">
            &times;
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type HEX } from "color-convert";
import { useColorStore } from '@/stores/colorStore';
import { dimensionOptionLabel, exploreOptions } from '@/utils/options';
import { useAppStore } from '@/stores/appStore';
import { Axes, Dimensions, LocResolutions } from '@/types';

const appStore = useAppStore();
const colorStore = useColorStore();

const colors = computed(() => {
  const { colorDimension } = colorStore;
  if (colorDimension === appStore.dimensions[Axes.WITHIN_BAND] && colorDimension === Dimensions.LOCATION) {

    // Sort by the geographical resolution (LocResolutions) of the values.
    return Array.from(colorStore.colorMapping).sort(([aVal], [bVal]) => {
      const [aLocRes, bLocRes] = [
        appStore.geographicalResolutionForLocation(aVal),
        appStore.geographicalResolutionForLocation(bVal)
      ];
      const [aRank, bRank] = [
        aLocRes ? Object.values(LocResolutions).indexOf(aLocRes) : -1,
        bLocRes ? Object.values(LocResolutions).indexOf(bLocRes) : -1,
      ];
      return bRank - aRank;
    });
  }
  // TODO: (vimc-9191) a less hacky way of getting the same ordering on the legend as on the plot (this way doesn't work for persisted mappings like global)
  return Array.from(colorStore.colorMapping).toReversed();
})

const isFilteredByLegend = (value: string) => !appStore.softFilters[colorStore.colorDimension]?.includes(value);

const colorBoxStyle = (color: HEX) => {
  const { fillColor, strokeColor } = colorStore.colorProperties(color);
  return {
    backgroundColor: fillColor,
    borderColor: strokeColor,
  }
}

const handleClick = (value: string) => {
  if (!appStore.softFilters[colorStore.colorDimension]) {
    return;
  }

  if (appStore.softFilters[colorStore.colorDimension]?.includes(value)) {
    appStore.softFilters[colorStore.colorDimension] = appStore.softFilters[colorStore.colorDimension]!.filter(v => v !== value);
  } else {
    appStore.softFilters[colorStore.colorDimension]?.push(value);
  }
}
</script>

<style scoped>
.legend-label {
  line-height: 1rem;
  margin-top: 1px;
  word-wrap: normal;
}

.legend-color-box {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  border-style: solid;
}

.legend-button {
  &.filtered-by-legend {
    text-decoration: line-through;
    text-decoration-color: gray;

    .close-button {
      display: none;
    }

    &:not(:hover) {
      color: var(--color-gray-500);

      .legend-color-box {
        background-color: var(--color-gray-200) !important;
      }
    }

    &:hover {
      color: var(--color-gray-800);
    }
  }

  &:not(.filtered-by-legend) {
    &:hover {
      opacity: 0.75;

      .close-button {
        color: red;
      }
    }

    .legend-color-box {
      border-width: 2px;
    }
  }
}
</style>
