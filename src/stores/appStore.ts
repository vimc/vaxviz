import { BurdenMetrics, Dimensions, LocResolutions } from "@/types";
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

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
  const logScaleEnabled = ref(true);
  const splitByActivityType = ref<boolean>(false);

  // The x categorical axis corresponds to horizontal slicing of the ridgeline plot (columns).
  const xCategoricalAxis = ref<Dimensions | null>(splitByActivityType.value ? Dimensions.ACTIVITY_TYPE : null);
  // The y categorical axis corresponds to the rows of the ridgeline plot.
  const yCategoricalAxis = ref<Dimensions>(Dimensions.DISEASE);
  // The 'within-band' axis is often denoted by color. It distinguishes different lines that share the same categorical axis values.
  const withinBandAxis = ref<Dimensions>(Dimensions.LOCATION);

  // The plot presents a slice of the data depending on the user's choice of a 'focus' value that is either
  // a specific location or a specific disease of interest.
  // Thus we first ask the user to choose whether to explore by location or by disease,
  // and then present a dropdown of the relevant options.
  const exploreBy = ref<Dimensions.LOCATION | Dimensions.DISEASE>(Dimensions.LOCATION);
  const focus = ref<string>(LocResolutions.GLOBAL);

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  // The dimensions currently in use: up to three will be in use at any given time.
  const dimensions = computed(() => ({
    x: xCategoricalAxis.value,
    y: yCategoricalAxis.value,
    withinBand: withinBandAxis.value
  }));

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
      yCategoricalAxis.value = Dimensions.LOCATION;
      withinBandAxis.value = Dimensions.DISEASE;
    } else {
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
    dimensions,
    exploreBy,
    exploreByLabel,
    exploreOptions,
    focus,
    logScaleEnabled,
    metricOptions,
    splitByActivityType,
  };
})

