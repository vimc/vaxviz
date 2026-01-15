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
import { BurdenMetric, Dimension } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import { http, HttpResponse } from 'msw';
import { nextTick } from 'vue';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectLastNCallsToEqual = (spy: Mock, args: any[]) => {
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

    // Initial data
    let expectedFetches = 1;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(histCountsDeathsDiseaseLog.length);
      expect(dataStore.histogramData[0]).toEqual({
        disease: "Cholera",
        Counts: 1,
        lower_bound: -2.434,
        upper_bound: -2.422,
      });
      expect(fetchSpy).toBeCalledTimes(expectedFetches);
      expectLastNCallsToEqual(fetchSpy, ["./data/json/hist_counts_deaths_disease_log.json"]);
    });

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focus).toEqual("global");
    appStore.focus = "Middle Africa";
    expectedFetches += 2;
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
    });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToEqual(fetchSpy, [
      "./data/json/hist_counts_dalys_disease_subregion_activity_type.json",
      "./data/json/hist_counts_dalys_disease_activity_type.json",
    ]);

    // Change options: round 2
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("Cholera")
      expect(fetchSpy).toBeCalledTimes(expectedFetches); // No increment in expectedFetches due to cacheing.
    });
    appStore.focus = "Measles";
    expectedFetches += 2;
    appStore.burdenMetric = BurdenMetric.DEATHS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(
        histCountsDeathsDiseaseSubregionActivityType.length + histCountsDeathsDiseaseActivityType.length
      );
    });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToEqual(fetchSpy, [
      "./data/json/hist_counts_deaths_disease_subregion_activity_type.json",
      "./data/json/hist_counts_deaths_disease_activity_type.json",
    ]);

    // Change options: round 3
    appStore.exploreBy = "location";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("global")
      expect(fetchSpy).toBeCalledTimes(expectedFetches); // No increment in expectedFetches due to cacheing.
    });
    appStore.focus = "AFG";
    expectedFetches += 3;
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = true;
    appStore.splitByActivityType = false;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).toHaveLength(
        histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length + histCountsDalysDiseaseLog.length
      );
    }, { timeout: 2500 });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToEqual(fetchSpy, [
      "./data/json/hist_counts_dalys_disease_subregion_log.json",
      "./data/json/hist_counts_dalys_disease_country_log.json",
      "./data/json/hist_counts_dalys_disease_log.json",
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
        { message: `Error loading data from path: hist_counts_deaths_disease_log.json. TypeError: Failed to fetch` }
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
        { message: `Error loading data from path: hist_counts_deaths_disease_log.json. Error: HTTP 404: Not Found` }
      )]);
    });

    expect(dataStore.histogramData).toEqual([]);
  });

  describe("summaryTablePaths", () => {
    it("should return correct path for global view with default settings", () => {
      const [appStore, dataStore] = [useAppStore(), useDataStore()];
      expect(appStore.focus).toBe("global");
      expect(appStore.burdenMetric).toBe(BurdenMetric.DEATHS);

      expect(dataStore.summaryTablePaths).toHaveLength(1);
      expect(dataStore.summaryTablePaths[0]).toBe("summary_table_deaths_disease.csv");
    });

    it("should return correct path when burdenMetric is DALYs", () => {
      const [appStore, dataStore] = [useAppStore(), useDataStore()];
      appStore.burdenMetric = BurdenMetric.DALYS;

      expect(dataStore.summaryTablePaths).toHaveLength(1);
      expect(dataStore.summaryTablePaths[0]).toBe("summary_table_dalys_disease.csv");
    });

    it("should return correct path when splitByActivityType is enabled", async () => {
      const [appStore, dataStore] = [useAppStore(), useDataStore()];
      appStore.splitByActivityType = true;
      await nextTick();

      expect(dataStore.summaryTablePaths).toHaveLength(1);
      expect(dataStore.summaryTablePaths[0]).toBe("summary_table_deaths_disease_activity_type.csv");
    });

    it("should return correct paths for subregion focus (i.e. one path for subregion data and one for global data)", () => {
      const [appStore, dataStore] = [useAppStore(), useDataStore()];
      appStore.focus = "Middle Africa";

      expect(dataStore.summaryTablePaths).toHaveLength(2);
      expect(dataStore.summaryTablePaths[0]).toBe("summary_table_deaths_disease_subregion.csv");
      expect(dataStore.summaryTablePaths[1]).toBe("summary_table_deaths_disease.csv");
    });

    it("should return correct paths for country focus (i.e. for each of country, subregion, and global data)", () => {
      const [appStore, dataStore] = [useAppStore(), useDataStore()];
      appStore.focus = "AFG";

      expect(dataStore.summaryTablePaths).toHaveLength(3);
      expect(dataStore.summaryTablePaths[0]).toBe("summary_table_deaths_disease_country.csv");
      expect(dataStore.summaryTablePaths[1]).toBe("summary_table_deaths_disease_subregion.csv");
      expect(dataStore.summaryTablePaths[2]).toBe("summary_table_deaths_disease.csv");
    });
  });
});
