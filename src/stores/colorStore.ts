import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Axes, Dimensions, type LineMetadata } from "@/types";
import { useAppStore } from "@/stores/appStore";
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

type ColorMapping = Record<string, Map<string, string>>;

export const useColorStore = defineStore("color", () => {
  const appStore = useAppStore();

  // A dict to keep track of which colors have been assigned to which values, so that we can
  // use the same color assignations consistently across rows.
  // The two nested maps map specific values to assigned colors.
  // In the future this will be passed as a prop to a legend component.
  const colorsByValue = ref<ColorMapping>();

  // colorDimension is the dimension (i.e. 'location' or 'disease')
  // whose values determine the colors for the lines.
  const colorDimension = computed(() => {
    // If there are multiple filtered values on the withinBand axis, those values determine the colors.

    // If we're filtered to just 1 value for the withinBand axis,
    // we assign colors based on the dimension assigned to the y-axis,
    // otherwise all lines would be the same color across all rows.
    return appStore.filters[appStore.dimensions[Axes.WITHIN_BAND]]?.length === 1
      ? appStore.dimensions[Axes.Y]
      : appStore.dimensions[Axes.WITHIN_BAND];
  });

  const colorMapping = computed(() => colorsByValue.value?.[colorDimension.value]);

  const getColorForLine = (categoryValues: LineMetadata) => {
    const colorAxis = Object.keys(appStore.dimensions).find((axis) => {
      return appStore.dimensions[axis as Axes] === colorDimension.value;
    }) as Axes;
    const colorMap = colorMapping.value;
    if (!colorMap) {
      return undefined;
    }
    // `value` is the specific value, i.e. a specific location or disease,
    // whose color we need to look up or assign.
    const value = categoryValues[colorAxis];
    let color = colorMap.get(value);
    if (!color) {
      color = colors[colorMap.size % colors.length]!;
      colorMap.set(value, color);
    }
    return color;
  }

  const resetColorMapping = () => {
    // By setting the global color once here, we ensure that it gets the same color across chart updates.
    // NB `Object.freeze` is only a shallow freeze, preventing modification of the top-level object structure.
    colorsByValue.value = Object.freeze({
      [Dimensions.LOCATION]: new Map<string, string>([[globalOption.value, colors[0]!]]),
      [Dimensions.DISEASE]: new Map<string, string>(),
    });
  };

  return { colorDimension, colorMapping, getColorForLine, resetColorMapping };
});
