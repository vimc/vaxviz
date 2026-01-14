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

  const filters = ref<Record<string, string[]>>({
    [Dimension.DISEASE]: diseaseOptions.map(d => d.value),
    [Dimension.LOCATION]: [LocResolution.GLOBAL],
  });

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

  // The geographical resolutions to use based on current exploreBy and focus selections.
  const geographicalResolutions = computed(() => {
    if (exploreBy.value === Dimension.DISEASE) {
      return [LocResolution.SUBREGION, LocResolution.GLOBAL];
    } else {
      if (focus.value === LocResolution.GLOBAL) {
        return [LocResolution.GLOBAL];
      } else if (subregionOptions.find(o => o.value === focus.value)) {
        return [LocResolution.SUBREGION, LocResolution.GLOBAL];
      } else if (countryOptions.find(o => o.value === focus.value)) {
        return [LocResolution.COUNTRY, LocResolution.SUBREGION, LocResolution.GLOBAL];
      }
      // The following line should never be able to be evaluated, because exploreBy is always either
      // 'disease' or 'location', and the three possible types of location are covered by the branches.
      throw new Error(`Invalid focus selection '${focus.value}' for exploreBy '${exploreBy.value}'`);
    }
  });

  const getAxisForDimension = (dimension: Dimension | null) => (Object.entries(dimensions.value).find(([, dim]) => {
    return dim === dimension
  }) as [Axis, Dimension] | undefined)?.[0];

  const getLocationForGeographicalResolution = (geog: LocResolution) => {
    switch (geog) {
      case LocResolution.GLOBAL:
        return globalOption.value;
      case LocResolution.SUBREGION:
        return subregionOptions.find(o => o.value === focus.value)?.value
          ?? getSubregionFromCountry(focus.value);
      case LocResolution.COUNTRY:
        return focus.value;
    }
  }

  watch(exploreBy, () => {
    if (exploreBy.value === Dimension.DISEASE && diseaseOptions[0]) {
      focus.value = diseaseOptions[0].value;
    } else if (exploreBy.value === Dimension.LOCATION) {
      focus.value = LocResolution.GLOBAL;
    };
  });

  watch(focus, () => {
    const focusIsADisease = diseaseOptions.find(d => d.value === focus.value);
    if (focusIsADisease) {
      rowDimension.value = Dimension.LOCATION;
      withinBandDimension.value = Dimension.DISEASE;

      filters.value = {
        [Dimension.DISEASE]: [focus.value],
        [Dimension.LOCATION]: subregionOptions.map(o => o.value).concat([LocResolution.GLOBAL]),
      };
    } else {
      // This is only one possible way of 'focusing' on a 'location':
      // diseases as row axis, each row with up to 3 ridges.
      // An alternative would be to have the 3 location rows laid out on the row axis,
      // and disease(s) as color axis.
      rowDimension.value = Dimension.DISEASE;
      withinBandDimension.value = Dimension.LOCATION;

      filters.value = {
        [Dimension.DISEASE]: diseaseOptions.map(d => d.value),
        [Dimension.LOCATION]: geographicalResolutions.value.map(getLocationForGeographicalResolution),
      };
    };
  });

  watch(splitByActivityType, (split) => columnDimension.value = split ? Dimension.ACTIVITY_TYPE : null);

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
    logScaleEnabled,
    splitByActivityType,
  };
})

