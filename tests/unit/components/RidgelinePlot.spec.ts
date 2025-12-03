import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia';

import histCountsDeathsDiseaseLog from "@/../public/data/json/hist_counts_deaths_disease_log.json";
import histCountsDalysDiseaseSubregionActivityType from "@/../public/data/json/hist_counts_dalys_disease_subregion_activity_type.json";
import histCountsDalysDiseaseActivityType from "@/../public/data/json/hist_counts_dalys_disease_activity_type.json";
import histCountsDeathsDiseaseSubregionActivityType from "@/../public/data/json/hist_counts_deaths_disease_subregion_activity_type.json";
import histCountsDeathsDiseaseActivityType from "@/../public/data/json/hist_counts_deaths_disease_activity_type.json";
import histCountsDalysDiseaseSubregionLog from "@/../public/data/json/hist_counts_dalys_disease_subregion_log.json";
import histCountsDalysDiseaseCountryLog from "@/../public/data/json/hist_counts_dalys_disease_country_log.json";
import histCountsDalysDiseaseLog from "@/../public/data/json/hist_counts_dalys_disease_log.json";
import { BurdenMetrics } from '@/types';
import RidgelinePlot from '@/components/RidgelinePlot.vue'
import { useAppStore } from "@/stores/appStore";

describe('RidgelinePlot component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads the correct data', async () => {
    const appStore = useAppStore();
    const wrapper = mount(RidgelinePlot)

    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
      // No columns
      expect(dataAttr.x).toBeNull();
      // Rows differ by disease
      expect(dataAttr.y).toEqual("disease");
      // Ridges within a band 'differ' by location
      // (except that in this case there is only one location in use at the moment, 'global')
      expect(dataAttr.withinBand).toEqual("location");
    });

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focus).toEqual("global");
    appStore.focus = "Central and Southern Asia";
    appStore.burdenMetric = BurdenMetrics.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
      expect(dataAttr.x).toEqual("activity_type");
      expect(dataAttr.y).toEqual("disease");
      expect(dataAttr.withinBand).toEqual("location");
    });

    // Change options: round 2
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("Cholera")
    });
    appStore.focus = "Measles";
    appStore.burdenMetric = BurdenMetrics.DEATHS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDeathsDiseaseSubregionActivityType.length + histCountsDeathsDiseaseActivityType.length
      );
      expect(dataAttr.x).toEqual("activity_type");
      expect(dataAttr.y).toEqual("location");
      expect(dataAttr.withinBand).toEqual("disease");
    });

    // Change options: round 3
    appStore.exploreBy = "location";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("global")
    });
    appStore.focus = "AFG";
    appStore.burdenMetric = BurdenMetrics.DALYS;
    appStore.logScaleEnabled = true;
    appStore.splitByActivityType = false;
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length + histCountsDalysDiseaseLog.length
      );
      expect(dataAttr.x).toBeNull();
      expect(dataAttr.y).toEqual("disease");
      expect(dataAttr.withinBand).toEqual("location");
    });
  });
});
