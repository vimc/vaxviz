import { computed, ref } from "vue";
import { Dimensions, type LineMetadata } from "@/types";
import { useAppStore } from "@/stores/appStore";

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

export default () => {
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

  // Determine color for a line based on the line's categories,
  // which dimensions are in use on which axes,
  // and whether the filters are single-valued or multi-valued.
  const getColorForLine = (categories: LineMetadata) => {
    // `value` is the specific value, i.e. a specific location or disease,
    // whose assigned color we need to look up or assign.
    const value = colorDimension.value === appStore.dimensions.y
      ? categories.yVal
      : categories.withinBandVal;;
    const colorMap = colorsByValue.value[colorDimension.value]!;
    const color = colorMap.get(value) ?? colors[colorMap.size % colors.length]!;
    colorMap.set(value, color);
    return color;
  }

  return { getColorForLine };
}
