import { computed, watch, type Ref } from 'vue';
import {
  trackLogScaleToggle,
  trackPlotControls,
  type PlotAnalyticsProperties,
} from '@/utils/analytics';
import { BurdenMetric, Dimension } from '@/types';

export default ({
  focuses,
  exploreBy,
  splitByActivityType,
  legendSelections,
  burdenMetric,
  rowDimension,
  columnDimension,
  withinBandDimension,
  logScaleEnabled,
}: {
  focuses: Ref<string[]>,
  exploreBy: Ref<Dimension.LOCATION | Dimension.DISEASE>,
  splitByActivityType: Ref<boolean>,
  legendSelections: Ref<Record<string, string[]>>,
  burdenMetric: Ref<BurdenMetric>,
  rowDimension: Ref<Dimension>,
  columnDimension: Ref<Dimension | null>,
  withinBandDimension: Ref<Dimension>,
  logScaleEnabled: Ref<boolean>,
}) => {
  const plotAnalyticsProperties = computed((): Omit<PlotAnalyticsProperties, 'logOrLinearScale'> => ({
    focuses: [...focuses.value],
    exploreBy: exploreBy.value,
    activityTypeSplit: splitByActivityType.value ? 'split' : 'unsplit',
    legendSelections: [...(legendSelections.value[exploreBy.value] ?? [])],
    burdenMetric: burdenMetric.value,
    rowDimension: rowDimension.value,
    columnDimension: columnDimension.value,
    withinBandDimension: withinBandDimension.value,
  }));

  // This does not fire on initial app load, only on user-initiated changes to plot controls.
  watch([plotAnalyticsProperties, logScaleEnabled], ([plotProperties, logScaleEnabledValue]) => {
    trackPlotControls({
      ...plotProperties,
      logOrLinearScale: logScaleEnabledValue ? 'log' : 'linear',
    });
  });

  watch(logScaleEnabled, (enabled) => {
    trackLogScaleToggle(enabled ? 'log' : 'linear', {
      ...plotAnalyticsProperties.value,
    });
  });
};
