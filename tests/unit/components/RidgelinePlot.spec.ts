import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia } from 'pinia';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
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
import { BurdenMetric } from '@/types';
import RidgelinePlot from '@/components/RidgelinePlot.vue'
import { useAppStore } from "@/stores/appStore";
import { useDataStore } from '@/stores/dataStore';
import { useColorStore } from '@/stores/colorStore';
import { useDataStore } from '@/stores/dataStore';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const addAxesSpy = vi.fn().mockReturnThis();
const addTracesSpy = vi.fn().mockReturnThis();
const addTooltipsSpy = vi.fn().mockReturnThis();
const addAppendToSpy = vi.fn().mockReturnThis();

vi.mock('@reside-ic/skadi-chart', () => ({
  Chart: vi.fn().mockImplementation(class MockChart {
    addAxes = addAxesSpy;
    addTraces = addTracesSpy;
    addArea = vi.fn().mockReturnThis();
    addGridLines = vi.fn().mockReturnThis();
    addTooltips = addTooltipsSpy;
    makeResponsive = vi.fn().mockReturnThis();
    appendTo = addAppendToSpy;
  }),
}));

// Assert that the plot-rows are in the expected order,
// and that there is or is not an x-axis categorical scale.
const assertLastCategoricalScales = (expected: Record<"x" | "y", string[] | undefined>) => {
  const appendToLastCallArgs = addAppendToSpy.mock.calls[addAppendToSpy.mock.calls.length - 1];
  const catScales = appendToLastCallArgs[3];
  expect(catScales).toEqual(expected);
};

const expectCorrectMarginForRowDimension = (rowDimension: "disease" | "location", wrapper: ReturnType<typeof mount>) => {
  const leftMarginPx = rowDimension === "location" ? 170 : 110;
  expect(wrapper.find('#legendContainer').attributes('style')).toBe(`margin-left: ${leftMarginPx}px;`);
};

describe('RidgelinePlot component', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));

    // Define Mathjax globally to prevent errors during testing (in real life, it's defined in index.html)
    globalThis.MathJax = {};
  });

  it('loads the correct data', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const helpInfoStore = useHelpInfoStore();
    const wrapper = mount(RidgelinePlot)

    await vi.waitFor(() => {
      // Color by row; each disease has been assigned a color.
      expect(colorStore.colorMapping.size).toEqual(14);

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
      assertLastCategoricalScales({
        x: undefined,
        y: ["COVID-19", "JE", "Cholera", "Rubella", "Meningitis", "Typhoid", "Rota", "PCV", "YF", "Hib", "Malaria", "HepB", "Measles", "HPV"],
      });
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
      expectCorrectMarginForRowDimension("disease", wrapper);
    });

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focuses).toEqual(["global"]);
    appStore.focuses = ["Middle Africa"];
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      // Color by the 2 locations within each band: Middle Africa and global.
      expect(colorStore.colorMapping.size).toEqual(2);

      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
      // Not all diseases have data for all subregions and activity types.
      expect(dataAttr.lineCount).toEqual(44);
      expect(dataAttr.column).toEqual("activity_type");
      expect(dataAttr.row).toEqual("disease");
      expect(dataAttr.withinBand).toEqual("location");

      assertLastCategoricalScales({
        x: ["Campaign", "Routine"],
        y: ["COVID-19", "Cholera", "Rubella", "MenA", "MenACWYX", "Typhoid", "Rota", "HepB", "YF", "PCV", "Malaria", "Hib", "HPV", "Measles"],
      });
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(true);
      expectCorrectMarginForRowDimension("disease", wrapper);
    }, 5000);

    // Change options: round 2
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["Cholera"])
    });
    appStore.focuses = ["Measles"];
    appStore.burdenMetric = BurdenMetric.DEATHS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      // Color by row; each location (10 subregions + global) has been assigned a color.
      expect(colorStore.colorMapping.size).toEqual(11);

      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDeathsDiseaseSubregionActivityType.length + histCountsDeathsDiseaseActivityType.length
      );
      expect(dataAttr.lineCount).toEqual(22); // 10 applicable subregions with measles, + global, each with 2 activity types
      expect(dataAttr.column).toEqual("activity_type");
      expect(dataAttr.row).toEqual("location");
      expect(dataAttr.withinBand).toEqual("disease");

      assertLastCategoricalScales({
        x: ["Campaign", "Routine"],
        y: [
          "Eastern and Southern Europe",
          "Eastern and South-Eastern Asia",
          "Southern Africa",
          "Northern Africa and Western Asia",
          "Latin America and the Caribbean",
          "Central and Southern Asia",
          "All 117 VIMC countries",
          "Oceania",
          "Eastern Africa",
          "Western Africa",
          "Middle Africa",
        ],
      });
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(true);
      expectCorrectMarginForRowDimension("location", wrapper);
    }, { timeout: 5000 });

    // Change options: round 3
    appStore.exploreBy = "location";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["global"])
    });
    appStore.focuses = ["AFG"];
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = true;
    appStore.splitByActivityType = false;
    await vi.waitFor(() => {
      // Color by the 3 locations within each band: AFG, Central and Southern Asia, and global.
      expect(colorStore.colorMapping.size).toEqual(3);

      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(
        histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length + histCountsDalysDiseaseLog.length
      );
      // 10 applicable diseases, each with 3 locations (AFG, subregion, global),
      // + 1 disease (JE) with only 2 locations (no country-level data).
      expect(dataAttr.lineCount).toEqual(32);
      expect(dataAttr.column).toBeNull();
      expect(dataAttr.row).toEqual("disease");
      expect(dataAttr.withinBand).toEqual("location");

      assertLastCategoricalScales({
        x: undefined,
        y: ["Cholera", "COVID-19", "Typhoid", "Rubella", "Rota", "JE", "PCV", "HepB", "Hib", "HPV", "Measles"],
      });
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
      expectCorrectMarginForRowDimension("disease", wrapper);
    }, { timeout: 5000 });

    // Change options: round 4 (filtering out as if via legend component)
    expect(colorStore.colorDimension).toEqual("location");
    appStore.legendSelections["location"] = ["AFG", "global"];
    await vi.waitFor(() => {
      expect(colorStore.colorMapping.size).toEqual(3);
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      // 10 applicable diseases, each now with one fewer locations (no subregion).
      expect(dataAttr.lineCount).toEqual(21);
      expect(colorStore.colorMapping.size).toEqual(3);

      assertLastCategoricalScales({
        x: undefined,
        y: ["Cholera", "COVID-19", "Typhoid", "Rubella", "Rota", "JE", "PCV", "HepB", "Hib", "HPV", "Measles"],
      });
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
    });

    // Change options: round 5 (unfiltering as if via legend component)
    appStore.legendSelections["location"].push("Central and Southern Asia");
    await vi.waitFor(() => {
      expect(colorStore.colorMapping.size).toEqual(3);

      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.lineCount).toEqual(32);
      expect(colorStore.colorMapping.size).toEqual(3);

      assertLastCategoricalScales({
        x: undefined,
        y: ["Cholera", "COVID-19", "Typhoid", "Rubella", "Rota", "JE", "PCV", "HepB", "Hib", "HPV", "Measles"],
      });
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
    });

    // Change options: round 6 (multiple focuses: diseases)
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["Cholera"])
    });
    appStore.focuses = ["Cholera", "Measles"];
    await vi.waitFor(() => {
      expect(colorStore.colorMapping.size).toEqual(2);

      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.lineCount).toEqual(18); // 7 locations with Cholera, 11 with Measles

      assertLastCategoricalScales({
        x: undefined,
        y: ["Northern Africa and Western Asia",
          "Latin America and the Caribbean",
          "Eastern and Southern Europe", 
          "Southern Africa",
          "All 117 VIMC countries",
          "Eastern Africa",
          "Central and Southern Asia",
          "Eastern and South-Eastern Asia",
          "Middle Africa",
          "Western Africa",
          "Oceania",
        ],
      });
      expectCorrectMarginForRowDimension("location", wrapper);
    }, { timeout: 5000 });

    // Change options: round 7 (multiple focuses: locations)
    appStore.exploreBy = "location";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["global"])
    });
    appStore.focuses = ["AFG", "Eastern Africa"];
    await vi.waitFor(() => {
      expect(colorStore.colorMapping.size).toEqual(2);

      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.lineCount).toEqual(23); // 10 diseases for Afghanistan, 13 for Eastern Africa, no relevance-filtering applied

      assertLastCategoricalScales({
        x: undefined,
        y: ["COVID-19", "Cholera", "YF", "Rubella", "Typhoid", "Meningitis", "Rota", "PCV", "HepB", "Malaria", "Hib", "Measles", "HPV"],
      });
      expectCorrectMarginForRowDimension("disease", wrapper);
    }, { timeout: 5000 });
  }, 20000);

  it('when there is no focus selected, shows a message instead of the chart', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const helpInfoStore = useHelpInfoStore();
    const wrapper = mount(RidgelinePlot);

    // It shows a chart initially
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
      expect(colorStore.colorMapping.size).toEqual(14);
    });

    appStore.focuses = [];

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("No estimates available for the selected options.");
      expect(wrapper.find("#chartWrapper").exists()).toBe(false);
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
    });
    expect(colorStore.colorMapping.size).toEqual(0);
  });

  it('when there is no data available for the selected options, shows a message instead of the chart', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const helpInfoStore = useHelpInfoStore();
    const wrapper = mount(RidgelinePlot);

    // It shows a chart initially
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
      expect(colorStore.colorMapping.size).toEqual(14);
    });

    // Set options that lead to no data
    // There is no data for meningitis if split by activity type.
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["Cholera"])
    });
    appStore.focuses = ["Meningitis"];
    appStore.splitByActivityType = true;

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("No estimates available for the selected options.");
      expect(wrapper.find("#chartWrapper").exists()).toBe(false);
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
    });
    expect(colorStore.colorMapping.size).toEqual(0);
  });

  it('special "no data" message for meningitis vaccines', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const helpInfoStore = useHelpInfoStore();
    const wrapper = mount(RidgelinePlot);

    // Set options that lead to no data
    // There is no data for MenA except if we split by activity type.
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["Cholera"])
    });
    appStore.focuses = ["MenA"];
    appStore.splitByActivityType = false;

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("Estimates for MenA are only available at the campaign/routine level.");
      expect(wrapper.find("#chartWrapper").exists()).toBe(false);
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
    });
    expect(colorStore.colorMapping.size).toEqual(0);

    appStore.focuses = ["MenA", "MenACWYX"];
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("Estimates for MenA, MenACWYX are only available at the campaign/routine level.");
      expect(wrapper.find("#chartWrapper").exists()).toBe(false);
    });
  });

  it('when there is no data available for a subset of multiple focuses, shows a message along with the chart', async () => {
    const appStore = useAppStore();
    const colorStore = useColorStore();
    const wrapper = mount(RidgelinePlot);

    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focuses).toEqual(["Cholera"])
    });
    // There is no data for MenA except if we split by activity type.
    appStore.focuses = ["MenA", "Malaria", "Hib"];
    appStore.splitByActivityType = false;

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain("No estimates available with current options for the following focus selection(s): MenA");
      expect(wrapper.find("#chartWrapper").exists()).toBe(true);
      expect(colorStore.colorMapping.size).toEqual(2); // Colors for Malaria and Hib
    });
  });

  it('when there are fetch errors, shows an alert instead of the chart', async () => {
    // Mock the non-log data fetch to fail
    server.use(
      http.get("./data/json/hist_counts_deaths_disease.json", async () => {
        return HttpResponse.json(null, { status: 404 });
      }),
    );

    const appStore = useAppStore();
    const helpInfoStore = useHelpInfoStore();
    const wrapper = mount(RidgelinePlot);

    // It shows a chart initially
    await vi.waitFor(() => {
      const dataAttr = JSON.parse(wrapper.find("#chartWrapper").attributes("data-test")!);
      expect(dataAttr.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
    });

    appStore.logScaleEnabled = false;

    await vi.waitFor(() => {
      expect(wrapper.text()).not.toContain("No estimates available for the selected options.");
      expect(wrapper.text()).toContain("Error loading data");
      expect(wrapper.find("#chartWrapper").exists()).toBe(false);
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
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
      const { tickConfig } = lastCallArgs[0]!; // First argument to constructor

      expect(tickConfig).toEqual(expect.objectContaining({
        categorical: expect.objectContaining({
          y: expect.objectContaining({
            padding: 30,
          }),
        }),
      }));
      expect(tickConfig?.categorical?.y?.formatter).toBeUndefined();

      const axesLastCallArgs = addAxesSpy.mock.calls[addAxesSpy.mock.calls.length - 1];
      expect(axesLastCallArgs).toContainEqual(expect.objectContaining({
        x: "Impact ratio (per thousand vaccinated)",
        y: "Disease",
      }));
      expect(axesLastCallArgs).toContainEqual(expect.objectContaining({
        x: false,
        y: false,
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
          start: expect.closeTo(-1, 0),
          end: expect.closeTo(1, 0),
        },
        y: {
          start: 0,
          end: 55,
        },
      }));

      // Assert that all diseases (the current data dimension for the plot-rows) are in the correct order,
      // and that there is no x-axis categorical scale.
      assertLastCategoricalScales({
        x: undefined,
        y: ["COVID-19", "JE", "Cholera", "Rubella", "Meningitis", "Typhoid", "Rota", "PCV", "YF", "Hib", "Malaria", "HepB", "Measles", "HPV"],
      });

      const margins = appendToLastCallArgs[4];
      expect(margins).toEqual(expect.objectContaining({
        left: 110,
      }));
    });
  });

  it('shows a loading spinner while data is being loaded', async () => {
    const dataStore = useDataStore();
    const helpInfoStore = useHelpInfoStore();
    const wrapper = mount(RidgelinePlot);
    const spinnerMatcher = 'svg[role="status"]';

    expect(dataStore.isLoading).toBe(true);
    expect(wrapper.find(spinnerMatcher).exists()).toBe(true);
    expect(wrapper.text()).not.toContain("No estimates available for the selected options.");
    expect(wrapper.find("#chartWrapper").exists()).toBe(false);

    await vi.waitFor(() => {
      expect(dataStore.isLoading).toBe(false);
    });

    await vi.waitFor(() => {
      expect(wrapper.find(spinnerMatcher).exists()).toBe(false);
      expect(wrapper.find("#chartWrapper").exists()).toBe(true);
      expect(helpInfoStore.showNegativeValuesHelpInfo).toBe(false);
    });
  });
});
