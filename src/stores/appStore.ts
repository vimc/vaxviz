import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { getSubregionFromCountry } from "@/utils/regions"
import { Axes, BurdenMetrics, Dimensions, LocResolutions } from "@/types";
import countryOptions from '@/data/options/countryOptions.json';
import subregionOptions from '@/data/options/subregionOptions.json';
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { exploreOptions, globalOption } from "@/utils/options";

export const useAppStore = defineStore("app", () => {
  const burdenMetric = ref(BurdenMetrics.DEATHS);
  const logScaleEnabled = ref(true);
  const splitByActivityType = ref<boolean>(false);

  // The column axis corresponds to horizontal splitting of the ridgeline plot, known internally to skadi-chart as the 'x categorical' axis.
  // The row axis corresponds to the rows of the ridgeline plot, known internally to skadi-chart as the 'y categorical' axis.
  // The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
  const columnDimension = ref<Dimensions | null>(splitByActivityType.value ? Dimensions.ACTIVITY_TYPE : null);
  const rowDimension = ref<Dimensions>(Dimensions.DISEASE);
  const withinBandDimension = ref<Dimensions>(Dimensions.LOCATION);

  // The plot presents a slice of the data depending on the user's choice of a 'focus' value that is either
  // a specific location or a specific disease of interest.
  // Thus we first ask the user to choose whether to explore by location or by disease,
  // and then present a dropdown of the relevant options.
  const exploreBy = ref<Dimensions.LOCATION | Dimensions.DISEASE>(Dimensions.LOCATION);
  const focus = ref<string[]>([LocResolutions.GLOBAL]);

  // Two levels of filtering:
  // 'Hard' filters are about the palette of diseases or locations that are on offer in the current view,
  // and are determined by the selection of focus and exploreBy.
  // 'Soft' filters are a second level of filtration, on top of the options currently on offer,
  // e.g. via the color legend. They are easy to toggle on and off without changing the overall view.
  // Whenever hard filters update (and initially), soft filters are reset to match the hard filters.
  const hardFilters = ref<Record<string, string[]>>({
    [Dimensions.DISEASE]: diseaseOptions.map(d => d.value),
    [Dimensions.LOCATION]: [LocResolutions.GLOBAL],
  });
  const softFilters = ref<Record<string, string[]>>({});

  // TODO: use the tooltip HTML callback to update hoveredValue in the store.
  const hoveredValue = ref<string | null>(null);

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  // The dimensions currently in use, by axis: up to three will be in use at any given time.
  const dimensions = computed(() => ({
    [Axes.COLUMN]: columnDimension.value,
    [Axes.ROW]: rowDimension.value,
    [Axes.WITHIN_BAND]: withinBandDimension.value
  }));

  const resetSoftFilters = () => softFilters.value = {
    [Dimensions.DISEASE]: [...(hardFilters.value[Dimensions.DISEASE] ?? [])],
    [Dimensions.LOCATION]: [...(hardFilters.value[Dimensions.LOCATION] ?? [])],
  };
  resetSoftFilters();

  const geographicalResolutionForLocation = (location: string): LocResolutions | undefined => {
    if (location === globalOption.value) {
      return LocResolutions.GLOBAL;
    } else if (subregionOptions.find(o => o.value === location)) {
      return LocResolutions.SUBREGION;
    } else if (countryOptions.find(o => o.value === location)) {
      return LocResolutions.COUNTRY;
    }
  };

  // The geographical resolutions to use based on current exploreBy and focus selections.
  const geographicalResolutions = computed(() => {
    if (exploreBy.value === Dimensions.DISEASE) {
      return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
    } else {
      const resolutionsPerFocus = focus.value.map(loc => {
        switch (geographicalResolutionForLocation(loc)) {
          case LocResolutions.GLOBAL:
            return [LocResolutions.GLOBAL];
          case LocResolutions.SUBREGION:
            return [LocResolutions.SUBREGION, LocResolutions.GLOBAL];
          case LocResolutions.COUNTRY:
            return [LocResolutions.COUNTRY, LocResolutions.SUBREGION, LocResolutions.GLOBAL];
          default:
            // The following line should never be able to be evaluated, because exploreBy is always either
            // 'disease' or 'location', and the three possible types of location are covered by the branches.
            throw new Error(`Invalid focus selection '${focus.value}' for exploreBy '${exploreBy.value}'`);
        }
      });
      // Flatten and deduplicate the array of arrays.
      return Array.from(new Set(resolutionsPerFocus.flat()));
    }
  });

  // Based on the current focus selection of locations, return an array of locations
  // that includes the corresponding zoomed-out resolutions where applicable.
  const getLocationsAndZoomedOutResolutions = () => {
    const subregionsForCountries: string[] = [];
    let locs = focus.value.map((loc) => {
      switch (geographicalResolutionForLocation(loc)) {
        case LocResolutions.GLOBAL:
          return [globalOption.value];
        case LocResolutions.SUBREGION:
          return [loc, globalOption.value];
        case LocResolutions.COUNTRY:
          const subregion = getSubregionFromCountry(loc);
          subregionsForCountries.push(subregion);
          return [loc, getSubregionFromCountry(loc), globalOption.value];
        default:
          return [loc];
      }
    }).flat();

    if (subregionsForCountries.length > 1) {
      // There are multiple inferred subregions for the focus countries;
      // in order to reduce clutter we will remove these from the set of locations,
      // but we'll retain any subregions that are directly selected as focus.
      locs = locs.filter(loc => !subregionsForCountries.includes(loc) || focus.value.includes(loc));
    }

    // Flatten and deduplicate the array of arrays.
    return Array.from(new Set(locs));
  }

  const focusIsEmpty = computed(() => focus.value.length === 0);

  watch([exploreBy, focusIsEmpty], () => {
    if (exploreBy.value === Dimensions.DISEASE && diseaseOptions[0]) {
      focus.value = [diseaseOptions[0].value];
    } else if (exploreBy.value === Dimensions.LOCATION) {
      focus.value = [LocResolutions.GLOBAL];
    };
  });

  watch(focus, () => {
    if (exploreBy.value === Dimensions.DISEASE) {
      rowDimension.value = Dimensions.LOCATION;
      withinBandDimension.value = Dimensions.DISEASE;

      hardFilters.value = {
        [Dimensions.DISEASE]: focus.value,
        [Dimensions.LOCATION]: subregionOptions.map(o => o.value).concat([LocResolutions.GLOBAL]),
      };
    } else {
      // This is only one possible way of 'focusing' on a 'location':
      // diseases as row axis, each row with up to 3 ridges.
      // An alternative would be to have the 3 location rows laid out on the row axis,
      // and disease(s) as color axis.
      rowDimension.value = Dimensions.DISEASE;
      withinBandDimension.value = Dimensions.LOCATION;

      hardFilters.value = {
        [Dimensions.DISEASE]: diseaseOptions.map(d => d.value),
        [Dimensions.LOCATION]: getLocationsAndZoomedOutResolutions(),
      };
    };
  });

  watch(splitByActivityType, (split) => columnDimension.value = split ? Dimensions.ACTIVITY_TYPE : null);

  watch(hardFilters, resetSoftFilters);

  return {
    burdenMetric,
    dimensions,
    exploreBy,
    exploreByLabel,
    exploreOptions,
    focus,
    geographicalResolutions,
    hardFilters,
    hoveredValue,
    geographicalResolutionForLocation,
    logScaleEnabled,
    resetSoftFilters,
    softFilters,
    splitByActivityType,
  };
})

