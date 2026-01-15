import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { it, expect, describe, beforeEach, vi, Mock } from 'vitest';

import { server } from '../mocks/server';
import histCountsDeathsDiseaseLog from "@/../public/data/json/hist_counts_deaths_disease_log.json";
import histCountsDalysDiseaseSubregionActivityType from "@/../public/data/json/hist_counts_dalys_disease_subregion_activity_type.json";
import histCountsDalysDiseaseActivityType from "@/../public/data/json/hist_counts_dalys_disease_activity_type.json";
import histCountsDalysDiseaseSubregionLog from "@/../public/data/json/hist_counts_dalys_disease_subregion_log.json";
import histCountsDalysDiseaseCountryLog from "@/../public/data/json/hist_counts_dalys_disease_country_log.json";
import histCountsDalysDiseaseLog from "@/../public/data/json/hist_counts_dalys_disease_log.json";
import histCountsDeathsDiseaseSubregionActivityType from "@/../public/data/json/hist_counts_deaths_disease_subregion_activity_type.json";
import histCountsDeathsDiseaseActivityType from "@/../public/data/json/hist_counts_deaths_disease_activity_type.json";
import summaryDeathsDisease from "@/../public/data/json/summary_table_deaths_disease.json";
import summaryDalysDiseaseSubregionActivityType from "@/../public/data/json/summary_table_dalys_disease_subregion_activity_type.json";
import summaryDalysDiseaseActivityType from "@/../public/data/json/summary_table_dalys_disease_activity_type.json";
import summaryDeathsDiseaseSubregionActivityType from "@/../public/data/json/summary_table_deaths_disease_subregion_activity_type.json";
import summaryDeathsDiseaseActivityType from "@/../public/data/json/summary_table_deaths_disease_activity_type.json";
import summaryDalysDiseaseSubregion from "@/../public/data/json/summary_table_dalys_disease_subregion.json";
import summaryDalysDiseaseCountry from "@/../public/data/json/summary_table_dalys_disease_country.json";
import summaryDalysDisease from "@/../public/data/json/summary_table_dalys_disease.json";
import { BurdenMetric, Dimension } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { http, HttpResponse } from 'msw';
import { nextTick } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectLastNCallsToContain = (spy: Mock, args: any[]) => {
  const calls = spy.mock.calls;
  expect(calls.slice(calls.length - args.length)).toEqual(
    expect.arrayContaining(args.map(a => expect.arrayContaining([a]))),
  );
}

describe('data store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  it('should initialize with correct data, and request correct data as store selections change', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const appStore = useAppStore();
    const dataStore = useDataStore();
    expect(dataStore.histogramData).toEqual([]);
    expect(dataStore.summaryTableData).toEqual([]);

    // Initial data
    let expectedFetches = 2;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(histCountsDeathsDiseaseLog.length);
      expect(dataStore.histogramData[0]).toEqual(expect.objectContaining({ disease: "Cholera" }));
      expect(dataStore.summaryTableData).toHaveLength(summaryDeathsDisease.length);
      expect(dataStore.summaryTableData[0]).toEqual(expect.objectContaining({ disease: "COVID-19" }));
      expect(fetchSpy).toBeCalledTimes(expectedFetches);
      expectLastNCallsToContain(fetchSpy, [
        "./data/json/hist_counts_deaths_disease_log.json",
        "./data/json/summary_table_deaths_disease.json",
      ]);
    });

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focus).toEqual("global");
    appStore.focus = "Middle Africa";
    expectedFetches += 4;
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
      expect(dataStore.summaryTableData).toHaveLength(
        summaryDalysDiseaseSubregionActivityType.length + summaryDalysDiseaseActivityType.length
      );
    });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToContain(fetchSpy, [
      "./data/json/hist_counts_dalys_disease_subregion_activity_type.json",
      "./data/json/hist_counts_dalys_disease_activity_type.json",
      "./data/json/summary_table_dalys_disease_subregion_activity_type.json",
      "./data/json/summary_table_dalys_disease_activity_type.json",
    ]);

    // Regression test: check that location columns include both global and subregional.
    expect(dataStore.summaryTableData.map(r => r.location)).toEqual(expect.arrayContaining(["Middle Africa", "global"]));
    expect(dataStore.histogramData.map(r => r.location)).toEqual(expect.arrayContaining(["Middle Africa", "global"]));

    // Change options: round 2
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("Cholera")
      expect(fetchSpy).toBeCalledTimes(expectedFetches); // No increment in expectedFetches due to cacheing.
    });
    appStore.focus = "Measles";
    expectedFetches += 4;
    appStore.burdenMetric = BurdenMetric.DEATHS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(
        histCountsDeathsDiseaseSubregionActivityType.length + histCountsDeathsDiseaseActivityType.length
      );
      expect(dataStore.summaryTableData).toHaveLength(
        summaryDeathsDiseaseSubregionActivityType.length + summaryDeathsDiseaseActivityType.length
      );
    });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToContain(fetchSpy, [
      "./data/json/hist_counts_deaths_disease_subregion_activity_type.json",
      "./data/json/hist_counts_deaths_disease_activity_type.json",
      "./data/json/summary_table_deaths_disease_subregion_activity_type.json",
      "./data/json/summary_table_deaths_disease_activity_type.json",
    ]);

    // Change options: round 3
    appStore.exploreBy = "location";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("global")
      expect(fetchSpy).toBeCalledTimes(expectedFetches); // No increment in expectedFetches due to cacheing.
    });
    appStore.focus = "AFG";
    expectedFetches += 6;
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = true;
    appStore.splitByActivityType = false;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(
        histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length + histCountsDalysDiseaseLog.length
      );
      expect(dataStore.summaryTableData).toHaveLength(
        summaryDalysDiseaseSubregion.length + summaryDalysDiseaseCountry.length + summaryDalysDisease.length
      );
    }, { timeout: 2500 });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToContain(fetchSpy, [
      "./data/json/hist_counts_dalys_disease_subregion_log.json",
      "./data/json/hist_counts_dalys_disease_country_log.json",
      "./data/json/hist_counts_dalys_disease_log.json",
      "./data/json/summary_table_dalys_disease_subregion.json",
      "./data/json/summary_table_dalys_disease_country.json",
      "./data/json/summary_table_dalys_disease.json",
    ]);
  })

  it('should handle fetch errors gracefully', async () => {
    server.use(
      http.get("./data/json/hist_counts_deaths_disease_log.json", async () => {
        return HttpResponse.error();
      }),
    );
    const dataStore = useDataStore();

    expect(dataStore.fetchErrors).toEqual([]);

    const fetchSpy = vi.spyOn(global, 'fetch')
    await vi.waitFor(() => {
      expect(fetchSpy).toBeCalled();
      expect(dataStore.fetchErrors).toEqual([expect.objectContaining(
        { message: `Error loading data from path: ./data/json/hist_counts_deaths_disease_log.json. TypeError: Failed to fetch` }
      )]);
    });

    expect(dataStore.histogramData).toEqual([]);
  });

  it('should handle non-OK HTTP statuses gracefully', async () => {
    server.use(
      http.get("./data/json/hist_counts_deaths_disease_log.json", async () => {
        return HttpResponse.json(null, { status: 404 });
      }),
    );
    const dataStore = useDataStore();

    expect(dataStore.fetchErrors).toEqual([]);

    const fetchSpy = vi.spyOn(global, 'fetch')
    await vi.waitFor(() => {
      expect(fetchSpy).toBeCalled();
      expect(dataStore.fetchErrors).toEqual([expect.objectContaining(
        { message: `Error loading data from path: ./data/json/hist_counts_deaths_disease_log.json. Error: HTTP 404: Not Found` }
      )]);
    });

    expect(dataStore.histogramData).toEqual([]);
  });
});
