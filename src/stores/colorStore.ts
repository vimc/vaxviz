import { defineStore } from "pinia";
import { computed } from "vue";
import { Axes, Dimensions, type LineMetadata } from "@/types";
import { useAppStore } from "@/stores/appStore";
import { globalOption } from "@/utils/options";

// The IBM categorical palettes, which aim to maximise accessibility:
// https://carbondesignsystem.com/data-visualization/color-palettes/#categorical-palettes

// `ibmColors`: This sequence is to be used when the number of categories is unknown in advance, or > 5.
// It should be used specifically in this ordering.
const ibmColors = Object.freeze({
  purple70: "#6929c4",
  cyan50: "#1192e8",
  teal70: "#005d5d",
  magenta70: "#9f1853",
  red50: "#fa4d56",
  red90: "#570408",
  green60: "#198038",
  blue80: "#002d9c",
  magenta50: "#ee538b",
  yellow50: "#b28600",
  teal50: "#009d9a",
  cyan90: "#012749",
  orange70: "#8a3800",
  purple50: "#a56eff",
});

// Certain specific palettes are to be used when the number of categories is known in advance (1 to 5):
// https://carbondesignsystem.com/data-visualization/color-palettes/#categorical-palettes
// The following palettes were selected from the palette options so as to ensure there is always a purple70 in the mix.
const palettesByCategoryCount: Record<number, string[]> = Object.freeze({
  2: [ibmColors.purple70, ibmColors.teal50], // IBM 2-color group option 1
  3: [ibmColors.purple70, ibmColors.cyan50, ibmColors.magenta50], // IBM 3-color group option 4 (in reverse order to put purple70 first)
  4: [ibmColors.purple70, ibmColors.cyan90, ibmColors.teal50, ibmColors.magenta50], // IBM 4-color group option 2
  5: [ibmColors.purple70, ibmColors.cyan50, ibmColors.teal70, ibmColors.magenta70, ibmColors.red90], // IBM 5-color group option 1
});

export const useColorStore = defineStore("color", () => {
  const appStore = useAppStore();

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

  const categories = computed(() => appStore.filters[colorDimension.value] ?? []);

  const colorList = computed(() => palettesByCategoryCount[categories.value.length] ?? Object.values(ibmColors));

  const colorMapping = computed(() => {
    const colorMap = new Map<string, string>();

    if (colorDimension.value === Dimensions.LOCATION) {
      // By setting the global color first, we ensure that it gets the same color across chart updates.
      colorMap.set(globalOption.value, colorList.value[0] ?? ibmColors.purple70);
    }

    // TODO: Once we have implemented ordering the categories, ensure that this ordering is reflected in
    // the color assignment, since the palettes maximize contrast between _neighboring_ colors.
    categories.value?.forEach((category) => {
      if (!colorMap.has(category)) {
        const nextColor = colorList.value.find(c => !Array.from(colorMap.values()).includes(c));
        if (nextColor) {
          colorMap.set(category, nextColor);
        } else {
          // If there are more categories than pre-defined colors, recycle colors traversing the list backwards,
          // since the palettes are designed to maximize contrast between neighboring colors.
          const recycledColor = Array.from(colorList.value).reverse()[1 + (colorMap.size % colorList.value.length)]!;
          colorMap.set(category, recycledColor);
        }
      }
    });

    return colorMap;
  });

  const getColorForLine = (categoryValues: LineMetadata) => {
    const colorAxis = Object.keys(appStore.dimensions).find((axis) => {
      return appStore.dimensions[axis as Axes] === colorDimension.value;
    }) as Axes;
    return colorMapping.value?.get(categoryValues[colorAxis]);
  };

  return { colorDimension, colorMapping, getColorForLine };
});
