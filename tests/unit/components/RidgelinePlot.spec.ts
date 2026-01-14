import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing'
import { Chart } from '@reside-ic/skadi-chart';

import histCountsDeathsDiseaseLog from "@/../public/data/json/hist_counts_deaths_disease_log.json";
import histCountsDalysDiseaseSubregionActivityType from "@/../public/data/json/hist_counts_dalys_disease_subregion_activity_type.json";
import histCountsDalysDiseaseActivityType from "@/../public/data/json/hist_counts_dalys_disease_activity_type.json";
import histCountsDeathsDiseaseSubregionActivityType from "@/../public/data/json/hist_counts_deaths_disease_subregion_activity_type.json";
import histCountsDeathsDiseaseActivityType from "@/../public/data/json/hist_counts_deaths_disease_activity_type.json";
import histCountsDalysDiseaseSubregionLog from "@/../public/data/json/hist_counts_dalys_disease_subregion_log.json";
import histCountsDalysDiseaseCountryLog from "@/../public/data/json/hist_counts_dalys_disease_country_log.json";
import histCountsDalysDiseaseLog from "@/../public/data/json/hist_counts_dalys_disease_log.json";
import diseaseOptions from '@/data/options/diseaseOptions.json';
import { BurdenMetrics } from '@/types';
import RidgelinePlot from '@/components/RidgelinePlot.vue'
import { useAppStore } from "@/stores/appStore";
import { useColorStore } from '@/stores/colorStore';

const addAxesSpy = vi.fn().mockReturnThis();
const addTracesSpy = vi.fn().mockReturnThis();
const addGridLinesSpy = vi.fn().mockReturnThis();
const addTooltipsSpy = vi.fn().mockReturnThis();
const addAppendToSpy = vi.fn().mockReturnThis();

vi.mock('@reside-ic/skadi-chart', () => ({
  Chart: vi.fn().mockImplementation(class MockChart {
    addAxes = addAxesSpy;
    addTraces = addTracesSpy;
    addArea = vi.fn().mockReturnThis();
    addGridLines = addGridLinesSpy;
    addTooltips = addTooltipsSpy;
    addZoom = vi.fn().mockReturnThis();
    makeResponsive = vi.fn().mockReturnThis();
    appendTo = addAppendToSpy;
  }),
}));

describe('RidgelinePlot component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
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
    }, { timeout: 3000 });

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
    }, { timeout: 3000 });
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

  it('passes correct options to Chart', async () => {
    mount(RidgelinePlot);

    await vi.waitFor(() => {
      // Access the mock calls
      const chartMock = vi.mocked(Chart);
      expect(chartMock).toHaveBeenCalled();

      // Get the options from the most recent call
      const lastCallArgs = chartMock.mock.calls[chartMock.mock.calls.length - 1];
      const { tickConfig } = lastCallArgs[0]; // First argument to constructor

      expect(tickConfig).toEqual(expect.objectContaining({
        numerical: expect.objectContaining({
          x: expect.objectContaining({
            padding: 10,
            formatter: expect.any(Function),
          }),
          y: expect.objectContaining({ count: 0 }),
        }),
        categorical: expect.objectContaining({
          x: expect.objectContaining({ padding: 30 }),
          y: expect.objectContaining({
            padding: 30,
            formatter: expect.undefined,
          }),
        }),
      }));

      const axesLastCallArgs = addAxesSpy.mock.calls[addAxesSpy.mock.calls.length - 1];
      expect(axesLastCallArgs).toContainEqual(expect.objectContaining({
        x: "Impact ratio",
        y: "Disease",
      }));

      const tracesLastCallArgs = addTracesSpy.mock.calls[addTracesSpy.mock.calls.length - 1];
      const lines = tracesLastCallArgs[0];

      expect(lines).toHaveLength(14);

      const lineRows = lines.map(l => l.metadata.row);
      const diseases = diseaseOptions.filter(d => lineRows.includes(d.value));
      expect(diseases).toHaveLength(14);

      expect(lines.every(l => l.metadata.withinBand === "global")).toBe(true);
      expect(lines.every(l => l.metadata.column === undefined)).toBe(true);

      const appendToLastCallArgs = addAppendToSpy.mock.calls[addAppendToSpy.mock.calls.length - 1];
      const chartWrapperDiv = appendToLastCallArgs[0];
      expect(chartWrapperDiv.id).toEqual("chartWrapper");

      const numScales = appendToLastCallArgs[1];
      expect(numScales).toEqual(expect.objectContaining({
        x: {
          end: expect.closeTo(1.0431),
          start: expect.closeTo(-2.434),
        },
        y: {
          end: 29,
          start: 0,
        },
      }));

      const catScales = appendToLastCallArgs[3];
      expect(catScales).toEqual(expect.objectContaining({
        x: [],
        y: expect.arrayContaining(diseases.map(d => d.label)),
      }));

      const margins = appendToLastCallArgs[4];
      expect(margins).toEqual(expect.objectContaining({
        left: 100,
      }));
    });
  });
});
