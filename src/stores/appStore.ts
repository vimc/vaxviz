import { BurdenMetrics, Dimensions, LocResolutions, type Option } from "@/types";
import { dataDir } from "@/composables/useData";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { getCountryName, getSubregionFromCountry } from "@/utils/regions";

const metricOptions = [
  { label: "DALYs averted", value: BurdenMetrics.DALYS },
  { label: "Deaths averted", value: BurdenMetrics.DEATHS },
];

const exploreOptions = [
  { label: "Disease", value: Dimensions.DISEASE },
  { label: "Geography", value: Dimensions.LOCATION },
];

export const useAppStore = defineStore("app", () => {
  const initialized = ref(false);
  const countryOptions = ref<Option[]>([]);
  const subregionOptions = ref<Option[]>([]);
  const diseaseOptions = ref<Option[]>([]);

  const burdenMetric = ref(BurdenMetrics.DEATHS);
  const logScaleEnabled = ref(true);
  const splitByActivityType = ref<boolean>(false);

  // The x categorical axis corresponds to the horizontal slicing of the ridgeline plot for splitting by activity type.
  const xCategoricalAxis = ref<Dimensions | null>(splitByActivityType.value ? Dimensions.ACTIVITY_TYPE : null);
  // The y categorical axis corresponds to the rows of the ridgeline plot.
  const yCategoricalAxis = ref<Dimensions>(Dimensions.DISEASE);
  // The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
  const withinBandAxis = ref<Dimensions | null>(null);

  const exploreBy = ref(exploreOptions.find(o => o.value === Dimensions.DISEASE)?.value);
  const focus = ref("");

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  // The dimensions currently in use: up to three axes will be in use at any given time.
  const dimensions = computed(() => {
    return {
      x: xCategoricalAxis.value,
      y: yCategoricalAxis.value,
      withinBand: withinBandAxis.value
    };
  });

  const initialize = async () => {
    const countryOpts: Option[] = [];
    const subregionOpts: Option[] = [];
    const diseaseOpts: Option[] = [];
    // One-off initial loads of summary tables to find the options for controls.
    // NB Some diseases (e.g. Malaria) are included only at the subregional level.
    await Promise.all([
      "summary_table_deaths_disease_country.json",
      "summary_table_deaths_disease_subregion.json",
    ].map(async (path) => {
      const response = await fetch(`${dataDir}/${path}`);
      const rows = await response.json();
      for (const row of rows) {
        const countryValue = row?.[LocResolutions.COUNTRY]?.toString();
        const subregionValue = row?.[LocResolutions.SUBREGION]?.toString();
        const diseaseValue = row?.[Dimensions.DISEASE]?.toString();
        if (countryValue) {
          countryOpts.push({
            value: countryValue,
            label: getCountryName(countryValue) ?? countryValue
          });
        } else if (subregionValue) {
          subregionOpts.push({
            value: subregionValue,
            label: subregionValue
          });
        }
        if (diseaseValue) {
          diseaseOpts.push({
            value: diseaseValue,
            label: diseaseValue
          });
        }
      }
    }));

    // Deduplicate and sort options.
    countryOptions.value = countryOpts.filter((option, index, self) =>
      index === self.findIndex((o) => o.value === option.value)
    ).sort((a, b) => a.label.localeCompare(b.label));
    subregionOptions.value = subregionOpts.filter((option, index, self) =>
      index === self.findIndex((o) => o.value === option.value)
    ).sort((a, b) => a.label.localeCompare(b.label));
    diseaseOptions.value = diseaseOpts.filter((option, index, self) =>
      index === self.findIndex((o) => o.value === option.value)
    ).sort((a, b) => a.label.localeCompare(b.label));

    initialized.value = true;
  };

  watch(exploreBy, () => {
    if (exploreBy.value === Dimensions.DISEASE && diseaseOptions.value[0]) {
      focus.value = diseaseOptions.value[0].value;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      focus.value = LocResolutions.GLOBAL;
    };
  });

  watch(focus, () => {
    if (exploreBy.value === Dimensions.DISEASE) {
      yCategoricalAxis.value = Dimensions.LOCATION;
      withinBandAxis.value = Dimensions.DISEASE;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      // This is only one possible way of 'focusing' on a 'location':
      // diseases as categorical Y axis, each row with up to 3 ridges.
      // An alternative would be to have the 3 location rows laid out on the categorical Y axis,
      // and disease(s) as color axis.
      yCategoricalAxis.value = Dimensions.DISEASE;
      withinBandAxis.value = Dimensions.LOCATION;
    };
  });

  watch(splitByActivityType, (split) => xCategoricalAxis.value = split ? Dimensions.ACTIVITY_TYPE : null);

  return {
    burdenMetric,
    countryOptions,
    diseaseOptions,
    dimensions,
    exploreBy,
    exploreByLabel,
    exploreOptions,
    focus,
    logScaleEnabled,
    initialize,
    initialized,
    metricOptions,
    splitByActivityType,
    subregionOptions,
  };
})
