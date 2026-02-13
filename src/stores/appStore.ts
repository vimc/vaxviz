import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { getSubregionFromCountry } from "@/utils/regions"
import { Axis, BurdenMetric, Dimension, LocResolution } from "@/types";
import countryOptions from '@/data/options/countryOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { exploreOptions, globalOption } from "@/utils/options";

export const useAppStore = defineStore("app", () => {
  const burdenMetric = ref(BurdenMetric.DEATHS);
  const logScaleEnabled = ref(true);
  const splitByActivityType = ref<boolean>(false);

  // The column axis corresponds to horizontal splitting of the ridgeline plot, known internally to skadi-chart as the 'x categorical' axis.
  // The row axis corresponds to the rows of the ridgeline plot, known internally to skadi-chart as the 'y categorical' axis.
  // The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
  const columnDimension = ref<Dimension | null>(splitByActivityType.value ? Dimension.ACTIVITY_TYPE : null);
  const rowDimension = ref<Dimension>(Dimension.DISEASE);
  const withinBandDimension = ref<Dimension>(Dimension.LOCATION);

  // The plot presents a slice of the data depending on the user's choice of a 'focus' value that is either
  // a specific location or a specific disease of interest.
  // Thus we first ask the user to choose whether to explore by location or by disease,
  // and then present a dropdown of the relevant options.
  const exploreBy = ref<Dimension.LOCATION | Dimension.DISEASE>(Dimension.LOCATION);
  const focus = ref<string>(LocResolution.GLOBAL);

  // For filters, inclusion in the array means 'included in the view'.
  // Note the 2 levels of filtration of diseases and locations:
  // - 'filters' are more of an internal, developer-facing concept. They describe the possible range
  // of diseases and locations that are validly available for the current view, and are fully determined
  // by the selection of focus and exploreBy.
  // - 'legend selections' are a second level of filtration which the user controls via the color legend,
  // applied on top of 'filters'; they're easily toggled on and off without constituting a change to the overall view.
  // Whenever 'filters' update (or are initialized), legend selections are reset to match the 'filters'.
  // The initial filters are set to include all diseases and a single location.
  const filters = ref<Record<string, string[]>>({
    [Dimension.DISEASE]: diseaseOptions.map(d => d.value),
    [Dimension.LOCATION]: [LocResolution.GLOBAL],
  });
  const legendSelections = ref<Record<string, string[]>>({});
  const resetLegendSelections = () => legendSelections.value = {
    [Dimension.DISEASE]: [...(filters.value[Dimension.DISEASE] ?? [])],
    [Dimension.LOCATION]: [...(filters.value[Dimension.LOCATION] ?? [])],
  };
  resetLegendSelections();

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  // The dimensions currently in use, by axis: up to three will be in use at any given time.
  const dimensions = computed(() => ({
    [Axis.COLUMN]: columnDimension.value,
    [Axis.ROW]: rowDimension.value,
    [Axis.WITHIN_BAND]: withinBandDimension.value
  }));

  const geographicalResolutionForLocation = (location: string): LocResolution | undefined => {
    if (location === globalOption.value) {
      return LocResolution.GLOBAL;
    } else if (subregionOptions.find(o => o.value === location)) {
      return LocResolution.SUBREGION;
    } else if (countryOptions.find(o => o.value === location)) {
      return LocResolution.COUNTRY;
    }
  };

  // The geographical resolutions currently in use, based on the current location filters.
  const geographicalResolutions = computed(() => {
    const locations = filters.value[Dimension.LOCATION] ?? [];
    const locationResolutions = locations.map(geographicalResolutionForLocation).filter(r => r !== undefined);
    return Array.from(new Set(locationResolutions)); // Get unique values;
  });

  const getAxisForDimension = (dimension: Dimension | null) => (Object.entries(dimensions.value).find(([, dim]) => {
    return dim === dimension
  }) as [Axis, Dimension] | undefined)?.[0];

  watch(exploreBy, () => {
    if (exploreBy.value === Dimension.DISEASE && diseaseOptions[0]) {
      focus.value = diseaseOptions[0].value;
    } else if (exploreBy.value === Dimension.LOCATION) {
      focus.value = LocResolution.GLOBAL;
    };
  });

  watch(focus, () => {
    // Check that the focus is valid given the current exploreBy selection.
    if (exploreBy.value === Dimension.DISEASE && !diseaseOptions.find(d => d.value === focus.value)) {
      throw new Error(`Invalid focus selection '${focus.value}' for exploreBy '${exploreBy.value}'`);
    } else if (exploreBy.value === Dimension.LOCATION && ![...countryOptions, ...subregionOptions, globalOption].find(o => o.value === focus.value)) {
      throw new Error(`Invalid focus selection '${focus.value}' for exploreBy '${exploreBy.value}'`);
    }

    const newFilters: Record<string, string[]> = {};

    if (exploreBy.value === Dimension.DISEASE) {
      newFilters[Dimension.DISEASE] = [focus.value];
      newFilters[Dimension.LOCATION] = subregionOptions.map(o => o.value).concat([globalOption.value]); // All subregions + global.
    } else {
      newFilters[Dimension.DISEASE] = diseaseOptions.map(d => d.value);

      // In the case of exploring by location, we want to include any subregion / global location containing the focus location.
      const country = countryOptions.find(o => o.value === focus.value)?.value;
      const subregion = country ? getSubregionFromCountry(country) : subregionOptions.find(o => o.value === focus.value)?.value;
      newFilters[Dimension.LOCATION] = [country, subregion, globalOption.value].filter(loc => loc !== undefined);
    }

    withinBandDimension.value = exploreBy.value;
    rowDimension.value = exploreOptions.find(o => o.value !== exploreBy.value)!.value;
    filters.value = newFilters;
  });

  watch(splitByActivityType, (split) => columnDimension.value = split ? Dimension.ACTIVITY_TYPE : null);

  watch(filters, resetLegendSelections);

  return {
    burdenMetric,
    dimensions,
    exploreBy,
    exploreByLabel,
    exploreOptions,
    filters,
    focus,
    geographicalResolutions,
    getAxisForDimension,
    geographicalResolutionForLocation,
    logScaleEnabled,
    resetLegendSelections,
    legendSelections,
    splitByActivityType,
  };
})

