import { BurdenMetrics, Dimensions, LocResolutions, type Option } from "@/types";
import { dataDir } from "@/utils/loadData";
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { getCountryName } from "@/utils/regions";

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
  const useLogScale = ref(true);
  const splitByActivityType = ref<boolean>(false);

  const exploreBy = ref(exploreOptions.find(o => o.value === Dimensions.DISEASE)?.value);
  const focus = ref("");

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

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  watch(exploreBy, () => {
    if (exploreBy.value === Dimensions.DISEASE && diseaseOptions.value[0]) {
      focus.value = diseaseOptions.value[0].value;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      focus.value = LocResolutions.GLOBAL;
    };
  });

  return {
    burdenMetric,
    countryOptions,
    diseaseOptions,
    exploreBy,
    exploreByLabel,
    exploreOptions,
    focus,
    initialize,
    initialized,
    metricOptions,
    splitByActivityType,
    subregionOptions,
    useLogScale,
  };
})
