import { BurdenMetrics, Dimensions, LocResolutions, type Option } from "@/types";
import { dataDir } from "@/utils/loadData";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { getCountryName, getSubregionFromCountry } from "@/utils/regions";

let countryOptions: Option[] = [];
let subregionOptions: Option[] = [];
let diseaseOptions: Option[] = [];

// One-off initial loads of summary tables to find the options for controls.
await Promise.all([
  "summary_table_dalys_disease_country.json",
  "summary_table_deaths_disease_country.json",
  "summary_table_dalys_disease_subregion.json",
  "summary_table_deaths_disease_subregion.json",
].map(async (path) => {
  const response = await fetch(`${dataDir}/${path}`);
  const rows = await response.json();
  for (const row of rows) {
    const countryValue = row?.[LocResolutions.COUNTRY]?.toString();
    const subregionValue = row?.[LocResolutions.SUBREGION]?.toString();
    const diseaseValue = row?.[Dimensions.DISEASE]?.toString();
    if (countryValue) {
      countryOptions.push({
        value: countryValue,
        label: getCountryName(countryValue) ?? countryValue
      });
    } else if (subregionValue) {
      subregionOptions.push({
        value: subregionValue,
        label: subregionValue
      });
    }
    if (diseaseValue) {
      diseaseOptions.push({
        value: diseaseValue,
        label: diseaseValue
      });
    }
  }
}));

// Deduplicate and sort options.
countryOptions = countryOptions.filter((option, index, self) =>
  index === self.findIndex((o) => o.value === option.value)
).sort((a, b) => a.label.localeCompare(b.label));
subregionOptions = subregionOptions.filter((option, index, self) =>
  index === self.findIndex((o) => o.value === option.value)
).sort((a, b) => a.label.localeCompare(b.label));
diseaseOptions = diseaseOptions.filter((option, index, self) =>
  index === self.findIndex((o) => o.value === option.value)
).sort((a, b) => a.label.localeCompare(b.label));

const metricOptions = [
  { label: "DALYs averted", value: BurdenMetrics.DALYS },
  { label: "Deaths averted", value: BurdenMetrics.DEATHS },
];

const exploreOptions = [
  { label: "Disease", value: Dimensions.DISEASE },
  { label: "Geography", value: Dimensions.LOCATION },
];

export const useAppStore = defineStore("app", () => {
  const burdenMetric = ref(BurdenMetrics.DEATHS);
  const useLogScale = ref(true);

  const exploreBy = ref(exploreOptions.find(o => o.value === Dimensions.DISEASE)?.value);
  const focus = ref("");

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  // The x categorical axis corresponds to the horizontal slicing of the ridgeline plot for splitting by activity type.
  const xCategoricalAxis = ref<Dimensions | null>(null);
  // The y categorical axis corresponds to the rows of the ridgeline plot.
  const yCategoricalAxis = ref<Dimensions>(Dimensions.DISEASE);
  // The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
  const withinBandAxis = ref<Dimensions | null>(null);
  const maxGeographicalResolution = ref<LocResolutions>(LocResolutions.SUBREGION);
  const splitByActivityType = ref<boolean>(
    [xCategoricalAxis.value, yCategoricalAxis.value, withinBandAxis.value].includes(Dimensions.ACTIVITY_TYPE)
  );
  const diseaseFilter = ref<string[]>([]);
  const locationFilter = ref<string[]>([]);

  const dimensionsInUse = computed(() => {
    return [yCategoricalAxis.value, xCategoricalAxis.value, withinBandAxis.value].filter(d => !!d)
  });

  watch(splitByActivityType, () => {
    xCategoricalAxis.value = splitByActivityType.value ? Dimensions.ACTIVITY_TYPE : null;
  }, { immediate: true });

  watch(exploreBy, () => {
    if (exploreBy.value === Dimensions.DISEASE && diseaseOptions[0]?.value) {
      focus.value = diseaseOptions[0].value;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      focus.value = LocResolutions.GLOBAL;
    };
  });

  watch(splitByActivityType, () => {
    xCategoricalAxis.value = splitByActivityType.value ? Dimensions.ACTIVITY_TYPE : null
  });

  watch(focus, () => {
    if (exploreBy.value === Dimensions.DISEASE) {
      diseaseFilter.value = [focus.value];
      locationFilter.value = []
      yCategoricalAxis.value = Dimensions.LOCATION;
      maxGeographicalResolution.value = LocResolutions.SUBREGION;
      withinBandAxis.value = Dimensions.DISEASE;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      // This is only one way of 'focusing' on a 'location': diseases as categorical Y axis, each row with up to 3 ridges.
      // An alternative would be to have the three rows laid out on the categorical Y axis, and diseases as color axis.
      yCategoricalAxis.value = Dimensions.DISEASE;
      withinBandAxis.value = Dimensions.LOCATION;
      if (focus.value === LocResolutions.GLOBAL) {
        locationFilter.value = [focus.value];
        maxGeographicalResolution.value = LocResolutions.GLOBAL;
      } else if (subregionOptions.find(o => o.value === focus.value)) {
        locationFilter.value = [focus.value, LocResolutions.GLOBAL];
        maxGeographicalResolution.value = LocResolutions.SUBREGION;
      } else if (countryOptions.find(o => o.value === focus.value)) {
        locationFilter.value = [focus.value, getSubregionFromCountry(focus.value), LocResolutions.GLOBAL];
        maxGeographicalResolution.value = LocResolutions.COUNTRY;
      }
      diseaseFilter.value = [];
    };
  });

  return {
    burdenMetric,
    useLogScale,
    exploreBy,
    exploreByLabel,
    focus,
    metricOptions,
    exploreOptions,
    countryOptions,
    subregionOptions,
    diseaseOptions,
    xCategoricalAxis,
    yCategoricalAxis,
    withinBandAxis,
    maxGeographicalResolution,
    splitByActivityType,
    diseaseFilter,
    locationFilter,
    dimensionsInUse,
  };
})
