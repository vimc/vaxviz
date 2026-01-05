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
import { useColorStore } from '@/stores/colorStore';

const addGridLinesSpy = vi.fn().mockReturnThis();

vi.mock('@reside-ic/skadi-chart', () => ({
  Chart: vi.fn().mockImplementation(class MockChart {
    addAxes = vi.fn().mockReturnThis();
    addTraces = vi.fn().mockReturnThis();
    addArea = vi.fn().mockReturnThis();
    addGridLines = addGridLinesSpy;
    addZoom = vi.fn().mockReturnThis();
    makeResponsive = vi.fn().mockReturnThis();
    appendTo = vi.fn();
  }),
}));

describe('RidgelinePlot component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('loads the correct data', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const wrapper = mount(RidgelinePlot)

    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
      expect(dataAttr.lineCount).toEqual(14); // 14 diseases have global data for aggregated activity type.
      // No columns
      expect(dataAttr.column).toBeNull();
      // Rows differ by disease
      expect(dataAttr.row).toEqual("disease");
      // Ridges within a band 'differ' by location
      // (except that in this case there is only one location in use at the moment, 'global')
      expect(dataAttr.withinBand).toEqual("location");

      // Color by row; each disease has been assigned a color.
      expect(colorStore.colorMapping.size).toEqual(14);
      expect(addGridLinesSpy).toHaveBeenLastCalledWith({ x: true, y: false });
    });

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focus).toEqual("global");
    appStore.focus = "Middle Africa";
    appStore.burdenMetric = BurdenMetrics.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
      // Not all diseases have data for all subregions and activity types.
      expect(dataAttr.lineCount).toEqual(44);
      expect(dataAttr.column).toEqual("activity_type");
      expect(dataAttr.row).toEqual("disease");
      expect(dataAttr.withinBand).toEqual("location");

      // Color by the 2 locations within each band: Middle Africa and global.
      expect(colorStore.colorMapping.size).toEqual(2);
      expect(addGridLinesSpy).toHaveBeenLastCalledWith({ x: false, y: false });
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
      expect(dataAttr.lineCount).toEqual(22); // 10 applicable subregions with measles, + global, each with 2 activity types
      expect(dataAttr.column).toEqual("activity_type");
      expect(dataAttr.row).toEqual("location");
      expect(dataAttr.withinBand).toEqual("disease");

      // Color by row; each location (10 subregions + global) has been assigned a color.
      expect(colorStore.colorMapping.size).toEqual(11);
      expect(addGridLinesSpy).toHaveBeenLastCalledWith({ x: false, y: false });
    }, { timeout: 2500 });

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
      expect(dataAttr.lineCount).toEqual(30); // 10 applicable diseases, each with 3 locations (AFG, subregion, global)
      expect(dataAttr.column).toBeNull();
      expect(dataAttr.row).toEqual("disease");
      expect(dataAttr.withinBand).toEqual("location");

      // Color by the 3 locations within each band: AFG, Central and Southern Asia, and global.
      expect(colorStore.colorMapping.size).toEqual(3);
      expect(addGridLinesSpy).toHaveBeenLastCalledWith({ x: true, y: false });
    }, { timeout: 2500 });
  }, 10000);

  it('when there is no data available for the selected options, shows a message instead of the chart', async () => {
    const appStore = useAppStore();
    const wrapper = mount(RidgelinePlot);

    // It shows a chart initially
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
    });

    // Set options that lead to no data
    // There is no data for MenA except if we split by activity type.
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("Cholera")
    });
    appStore.focus = "MenA";
    appStore.splitByActivityType = false;

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("No data available for the selected options.");
      expect(wrapper.find("#chartWrapper").exists()).toBe(false);
    });
  });
});
