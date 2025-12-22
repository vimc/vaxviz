import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { Axes, Dimensions, type LineMetadata } from "@/types";
import { useAppStore } from "@/stores/appStore";
import { globalOption } from "@/utils/options";

// The IBM categorical palettes, which aim to maximise accessibility:
// https://carbondesignsystem.com/data-visualization/color-palettes/#categorical-palettes

// `ibmAccessiblePalette`: This sequence is to be used when the number of categories is unknown in advance, or > 5.
// It should be used specifically in this ordering.
const ibmAccessiblePalette = Object.freeze({
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

// Not from IBM. We need to have as many color options as there are diseases.
const extraColors = {
  black: "#000000",
  white: "#ffffff",
};

// Certain specific palettes are to be used when the number of categories is known in advance (1 to 5):
// https://carbondesignsystem.com/data-visualization/color-palettes/#categorical-palettes
// The following palettes were selected from the palette options so as to ensure there is always a purple70 in the mix.
const palettesByCategoryCount: Record<number, string[]> = Object.freeze(
  Object.entries({
    2: ["purple70", "teal50"], // IBM 2-color group option 1
    3: ["purple70", "cyan50", "magenta50"], // IBM 3-color group option 4 (in reverse order to put purple70 first)
    4: ["purple70", "cyan90", "teal50", "magenta50"], // IBM 4-color group option 2
    5: ["purple70", "cyan50", "teal70", "magenta70", "red90"], // IBM 5-color group option 1
  }).reduce((acc, [key, colorKeys]) => {
    // Convert friendly-names to hex codes
    acc[Number(key)] = colorKeys.map(colorKey => ibmAccessiblePalette[colorKey as keyof typeof ibmAccessiblePalette]);
    return acc;
  }, {} as Record<number, string[]>)
);

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

  // The mapping from category value (e.g. a specific location or disease) to color hex code.
  // By setting the global color first, we ensure that it gets the same color across chart updates.
  const mapping = ref(
    colorDimension.value === Dimensions.LOCATION
      ? new Map<string, string>([[globalOption.value, ibmAccessiblePalette.purple70]])
      : new Map<string, string>()
  );
  // Expose a read-only version of the mapping to consumers of the store.
  const colorMapping = computed(() => mapping.value as ReadonlyMap<string, string>);

  const colorList = computed(() => {
    const categories = appStore.filters[colorDimension.value] ?? [];
    return palettesByCategoryCount[categories.length] ?? Object.values({ ...ibmAccessiblePalette, ...extraColors })
  });

  // Given a line's category values, either fetch the color from the mapping,
  // or assign it the next color in the list and return that.
  const getColorsForLine = (categoryValues: LineMetadata) => {
    const colorAxis = Object.keys(appStore.dimensions).find((axis) => {
      return appStore.dimensions[axis as Axes] === colorDimension.value;
    }) as Axes;
    // `value` is the specific value, i.e. a specific location or disease,
    // whose color we need to look up or assign.
    const value = categoryValues[colorAxis];
    const fillColor = mapping.value?.get(value) ?? colorList.value[mapping.value.size];
    if (fillColor) {
      mapping.value.set(value, fillColor);
    }
    return {
      fillColor: fillColor,
      strokeColor: fillColor === extraColors.white ? extraColors.black : fillColor,
    };
  };

  const resetColorMapping = () => {
    mapping.value = colorDimension.value === Dimensions.LOCATION
      ? new Map<string, string>([[globalOption.value, ibmAccessiblePalette.purple70]])
      : new Map<string, string>();
  }

  return { colorDimension, colorMapping, getColorsForLine, resetColorMapping };
});
