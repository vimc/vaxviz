<template>
  <div
    v-if="legendColors && legendColors.length >= 2"
    class="max-w-full h-full"
    id="colorLegend"
  >
    <h3 class="fs-3 font-medium mb-5 text-heading mb-2">
      {{ legendHeading }}
    </h3>
    <ul class="flex flex-col gap-y-1 max-h-full max-w-full">
      <li
        v-for="({ value, color, softFiltered, label }) in legendColors"
        :key="value"
      >
        <button
          type="button"
          class="legend-button flex gap-x-2 cursor-pointer"
          :class="{
            'filtered-by-legend': softFiltered,
          }"
          @click="handleClick(value)"
          @mouseover="handleMouseOver(value)"
          @mouseleave="appStore.hoveredValue = null"
        >
          <div class="flex gap-x-2 items-center text-sm">
            <span
              class="legend-color-box"
              :style="colorBoxStyle(color)"
            />
            <span class="legend-label">
              {{ label ?? value }}
            </span>
          </div>
          <span class="text-xs text-gray-500 ms-auto close-button">
            &times;
          </span>
        </button>
      </li>
    </ul>
    <div v-if="softFilter?.length !== hardFilter?.length" class="mt-4">
      <FwbButton
        color="light"
        class="cursor-pointer"
        size="sm"
        @click="appStore.resetSoftFilters"
      >
        Reset filters
      </FwbButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FwbButton } from 'flowbite-vue'
import { computed, ref, watch } from 'vue';
import { type HEX } from "color-convert";
import { useColorStore } from '@/stores/colorStore';
import { dimensionOptionLabel, exploreOptions } from '@/utils/options';
import { useAppStore } from '@/stores/appStore';
import { Axes, Dimensions, LocResolutions } from '@/types';

const appStore = useAppStore();
const colorStore = useColorStore();

const legendColors = ref<Array<{ value: string, color: HEX, softFiltered: boolean, label?: string }>>([]);
const legendHeading = ref<string>();

const softFilter = computed(() => appStore.softFilters[colorStore.colorDimension]);
const hardFilter = computed(() => appStore.hardFilters[colorStore.colorDimension]);

// Color mapping isn't ready for the new soft filters until the ridgelines have been computed
// (because color mapping depends on the slow computation of the ridgelines).
// I want the legend not to re-render until color mapping matches the (hard) filters.
// Use colorMappingMatchesFilters as a trigger for re-calculating the colors list on which the legend render depends.
const colorMappingMatchesFilters = computed(() => {
  console.log("Checking colorMappingMatchesFilters");
  if (colorStore.colorMapping.size === 0) {
    return false;
  }
  return Array.from(colorStore.colorMapping.keys()).every(value =>
    hardFilter.value?.includes(value)
  );
});

// Calculate colors and assign to colors ref. Also update legend heading.
watch([softFilter, () => colorStore.colorMapping, colorMappingMatchesFilters], () => {
  console.log("LOok again, sir")
  if (colorMappingMatchesFilters.value) {
    legendHeading.value = exploreOptions.find(o => o.value === colorStore.colorDimension)?.pluralLabel;

    const { colorDimension } = colorStore;
    let cols;
    if (colorDimension === appStore.dimensions[Axes.WITHIN_BAND] && colorDimension === Dimensions.LOCATION) {

      // Sort by the geographical resolution (LocResolutions) of the values.
      cols = Array.from(colorStore.colorMapping).sort(([aVal], [bVal]) => {
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
    } else {
      // TODO: (vimc-9191) a less hacky way of getting the same ordering on the legend as on the plot (this way doesn't work for persisted mappings like global)
      cols = Array.from(colorStore.colorMapping).toReversed();
    }

    // Add more values to the map, denoting:
    // softFiltered: whether it is included in the legend filters at the time of calculation.
    // label: the label to use with this color (depends on the current value of colorDimension).
    legendColors.value = cols.map(([value, color]) => (
      {
        value,
        color,
        softFiltered: !softFilter.value?.includes(value),
        label: dimensionOptionLabel(colorStore.colorDimension, value),
      }
    ));
  }
}, { immediate: true, deep: true });

const colorBoxStyle = (color: HEX) => {
  const { fillColor, strokeColor } = colorStore.colorProperties(color);
  return {
    backgroundColor: fillColor,
    borderColor: strokeColor,
  }
}

const handleClick = (value: string) => {
  const softFilter = appStore.softFilters[colorStore.colorDimension];
  console.log(softFilter);
  if (!softFilter) {
    return;
  }

  if (softFilter.includes(value)) {
    console.log("removing filter:", value);
    appStore.hoveredValue = null;
    appStore.softFilters[colorStore.colorDimension] = softFilter!.filter(v => v !== value);
  } else {
    console.log("adding filter:", value);
    softFilter.push(value);
  }
}

const handleMouseOver = (value: string) => {
  if (softFilter.value?.includes(value)) {
    appStore.hoveredValue = value;
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
