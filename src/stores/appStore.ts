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
  const focus = ref<string>(LocResolutions.GLOBAL);

  const filters = ref<Record<string, string[]>>({
    [Dimensions.DISEASE]: diseaseOptions.map(d => d.value),
    [Dimensions.LOCATION]: [LocResolutions.GLOBAL],
  });

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

  const geographicalResolutionForLocation = (location: string): LocResolutions | undefined => {
    if (location === LocResolutions.GLOBAL) {
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
      const locRes = geographicalResolutionForLocation(focus.value);
      switch (locRes) {
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
    }
  });

  const getAxisForDimension = (dimension: Dimensions | null) => (Object.entries(dimensions.value).find(([, dim]) => {
    return dim === dimension
  }) as [Axes, Dimensions] | undefined)?.[0];

  const getLocationForGeographicalResolution = (geog: LocResolutions) => {
    switch (geog) {
      case LocResolutions.GLOBAL:
        return globalOption.value;
      case LocResolutions.SUBREGION:
        return subregionOptions.find(o => o.value === focus.value)?.value
          ?? getSubregionFromCountry(focus.value);
      case LocResolutions.COUNTRY:
        return focus.value;
    }
  }

  watch(exploreBy, () => {
    if (exploreBy.value === Dimensions.DISEASE && diseaseOptions[0]) {
      focus.value = diseaseOptions[0].value;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      focus.value = LocResolutions.GLOBAL;
    };
  });

  watch(focus, () => {
    const focusIsADisease = diseaseOptions.find(d => d.value === focus.value);
    if (focusIsADisease) {
      rowDimension.value = Dimensions.LOCATION;
      withinBandDimension.value = Dimensions.DISEASE;

      filters.value = {
        [Dimensions.DISEASE]: [focus.value],
        [Dimensions.LOCATION]: subregionOptions.map(o => o.value).concat([LocResolutions.GLOBAL]),
      };
    } else {
      // This is only one possible way of 'focusing' on a 'location':
      // diseases as row axis, each row with up to 3 ridges.
      // An alternative would be to have the 3 location rows laid out on the row axis,
      // and disease(s) as color axis.
      rowDimension.value = Dimensions.DISEASE;
      withinBandDimension.value = Dimensions.LOCATION;

      filters.value = {
        [Dimensions.DISEASE]: diseaseOptions.map(d => d.value),
        [Dimensions.LOCATION]: geographicalResolutions.value.map(getLocationForGeographicalResolution),
      };
    };
  });

  watch(splitByActivityType, (split) => columnDimension.value = split ? Dimensions.ACTIVITY_TYPE : null);

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
    splitByActivityType,
  };
})

