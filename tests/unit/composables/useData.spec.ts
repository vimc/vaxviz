import { createPinia, setActivePinia } from 'pinia';
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
import { BurdenMetrics } from '@/types';
import useData from '@/composables/useData';
import { useAppStore } from '@/stores/appStore';
import { http, HttpResponse } from 'msw';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectLastNCallsToEqual = (spy: Mock, args: any[]) => {
  const calls = spy.mock.calls;
  expect(calls.slice(calls.length - args.length)).toEqual(
    expect.arrayContaining(args.map(a => expect.arrayContaining([a]))),
  );
}

describe('useData', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with correct data, and request correct data as store selections change', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const appStore = useAppStore();
    const { histogramData } = useData();
    expect(histogramData.value).toEqual([]);

    // Initial data
    let expectedFetches = 1;
    await vi.waitFor(() => {
      expect(histogramData.value).toHaveLength(histCountsDeathsDiseaseLog.length);
      expect(histogramData.value[0]).toEqual({
        disease: "Cholera",
        Counts: 1,
        lower_bound: -2.434,
        upper_bound: -2.422,
      });
      expect(fetchSpy).toBeCalledTimes(expectedFetches);
      expectLastNCallsToEqual(fetchSpy, ["/data/json/hist_counts_deaths_disease_log.json"]);
    });

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focus).toEqual("global");
    appStore.focus = "Central and Southern Asia";
    expectedFetches += 2;
    appStore.burdenMetric = BurdenMetrics.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      expect(histogramData.value).toHaveLength(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
    });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToEqual(fetchSpy, [
      "/data/json/hist_counts_dalys_disease_subregion_activity_type.json",
      "/data/json/hist_counts_dalys_disease_activity_type.json",
    ]);

    // Change options: round 2
    appStore.exploreBy = "disease";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("Cholera")
      expect(fetchSpy).toBeCalledTimes(expectedFetches); // No increment in expectedFetches due to cacheing.
    });
    appStore.focus = "Measles";
    expectedFetches += 2;
    appStore.burdenMetric = BurdenMetrics.DEATHS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;
    await vi.waitFor(() => {
      expect(histogramData.value).toHaveLength(
        histCountsDeathsDiseaseSubregionActivityType.length + histCountsDeathsDiseaseActivityType.length
      );
    });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToEqual(fetchSpy, [
      "/data/json/hist_counts_deaths_disease_subregion_activity_type.json",
      "/data/json/hist_counts_deaths_disease_activity_type.json",
    ]);

    // Change options: round 3
    appStore.exploreBy = "location";
    await vi.waitFor(() => {
      expect(appStore.focus).toEqual("global")
      expect(fetchSpy).toBeCalledTimes(expectedFetches); // No increment in expectedFetches due to cacheing.
    });
    appStore.focus = "AFG";
    expectedFetches += 3;
    appStore.burdenMetric = BurdenMetrics.DALYS;
    appStore.logScaleEnabled = true;
    appStore.splitByActivityType = false;
    await vi.waitFor(() => {
      expect(histogramData.value).toHaveLength(
        histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length + histCountsDalysDiseaseLog.length
      );
    }, { timeout: 2500 });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNCallsToEqual(fetchSpy, [
      "/data/json/hist_counts_dalys_disease_subregion_log.json",
      "/data/json/hist_counts_dalys_disease_country_log.json",
      "/data/json/hist_counts_dalys_disease_log.json",
    ]);
  })

  it('should handle fetch errors gracefully', async () => {
    server.use(
      http.get("/data/json/hist_counts_deaths_disease_log.json", async () => {
        return HttpResponse.error();
      }),
    );
    const { histogramData, fetchErrors } = useData();

    expect(fetchErrors.value).toEqual([]);

    const fetchSpy = vi.spyOn(global, 'fetch')
    await vi.waitFor(() => {
      expect(fetchSpy).toBeCalled();
      expect(fetchErrors.value).toEqual([expect.objectContaining(
        { message: `Error loading data from path: hist_counts_deaths_disease_log.json. TypeError: Failed to fetch` }
      )]);
    });

    expect(histogramData.value).toEqual([]);
  });
});
