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
  const useLogScale = ref(true);
  const splitByActivityType = ref<boolean>(false);

  const exploreBy = ref(exploreOptions.find(o => o.value === Dimensions.LOCATION)?.value);
  const focus = ref<string>(LocResolutions.GLOBAL);

  const exploreByLabel = computed(() => {
    const option = exploreOptions.find(o => o.value === exploreBy.value);
    return option ? option.label : "";
  });

  watch(exploreBy, () => {
    if (exploreBy.value === Dimensions.DISEASE && diseaseOptions[0]) {
      focus.value = diseaseOptions[0].value;
    } else if (exploreBy.value === Dimensions.LOCATION) {
      focus.value = LocResolutions.GLOBAL;
    };
  });

  return {
    burdenMetric,
    exploreBy,
    exploreByLabel,
    exploreOptions,
    focus,
    metricOptions,
    splitByActivityType,
    useLogScale,
  };
})

