import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Dimensions, LocResolutions, type LineMetadata } from "@/types";
import { useAppStore } from "@/stores/appStore";
import titleCase from "@/utils/titleCase";
import { globalOption } from "@/utils/options";

// The IBM categorical palette, which maximises accessibility, specifically in this ordering:
// https://carbondesignsystem.com/data-visualization/color-palettes/#categorical-palettes
const colors = [
  "#6929c4",
  "#1192e8",
  "#005d5d",
  "#9f1853",
  "#fa4d56",
  "#570408",
  "#198038",
  "#002d9c",
  "#ee538b",
  "#b28600",
  "#009d9a",
  "#012749",
  "#8a3800",
  "#a56eff",
];

export const useColorStore = defineStore("color", () => {
  const appStore = useAppStore();

  // A dict to keep track of which colors have been assigned to which values, so that we can
  // use the same color assignations consistently across rows.
  // The two nested maps map specific values to assigned colors.
  // In the future this will be passed as a prop to a legend component.
  const colorsByValue = ref<Record<string, Map<string, string>>>(
    Object.freeze({
      [Dimensions.LOCATION]: new Map<string, string>(),
      [Dimensions.DISEASE]: new Map<string, string>(),
    }),
  );

  // colorDimension is the dimension (i.e. 'location' or 'disease')
  // whose values determine the colors for the lines.
  const colorDimension = computed(() => {
    // If there are multiple filtered values on the withinBand axis, those values determine the colors.

    // If we're filtered to just 1 value for the withinBand axis,
    // we assign colors based on the dimension assigned to the y-axis,
    // otherwise all lines would be the same color across all rows.
    return appStore.filters[appStore.dimensions.withinBand]?.length === 1
      ? appStore.dimensions.y
      : appStore.dimensions.withinBand;
  });

  const colorMap = computed(() => colorsByValue.value[colorDimension.value]!);

  const getColorForLine = (categories: LineMetadata) => {
    // `value` is the specific value, i.e. a specific location or disease,
    // whose color we need to look up or assign.
    const value = colorDimension.value === appStore.dimensions.y
      ? categories.yVal
      : categories.withinBandVal;
    const color = colorMap.value.get(value) ?? colors[colorMap.value.size % colors.length]!;
    colorMap.value.set(value, color);
    return colorMap.value.get(value);
  }

  // TODO: Find a good way to ensure that 'global' gets the same color across chart updates.
  const resetColorMapping = () => {
    const globalColor = colorMap.value.get(globalOption.value) ?? colors[0]!;

    colorsByValue.value = Object.freeze({
      [Dimensions.LOCATION]: new Map<string, string>([[globalOption.value, globalColor]]),
      [Dimensions.DISEASE]: new Map<string, string>(),
    });
  }

  return { colorDimension, colorMap, getColorForLine, resetColorMapping };
});
