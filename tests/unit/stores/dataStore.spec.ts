import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { afterEach, it, expect, describe, beforeEach, vi, Mock } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
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
import { BurdenMetric } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { useDataStore } from '@/stores/dataStore';
import * as downloadModule from '@/utils/csvDownload';

const expectLastNFetchesToContain = (spy: Mock, args: string[]) => {
  const calls = spy.mock.calls;
  expect(calls.slice(calls.length - args.length)).toEqual(
    expect.arrayContaining(args.map(a => expect.arrayContaining([a]))),
  );
}

const expectLastCallToDownloadsToContain = (spy: Mock, zipFileName: string, filenames: string[]) => {
  const calls = spy.mock.calls;
  expect(calls.at(-1)[1]).toEqual(expect.arrayContaining(filenames));
  expect(calls.at(-1)[2]).toEqual(zipFileName);
}

describe('data store', () => {
  beforeEach(() => {
    setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct data, and request correct data as store selections change', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    const downloadSpy = vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip')
    const appStore = useAppStore();
    const dataStore = useDataStore();
    let expectedFetches = 0;

    const doAndExpectDownload = async (isZip: boolean, expectedZipFilename: string, expectedDownloadFilenames: string[]) => {
      await dataStore.downloadSummaryTables();
      if (isZip) {
        expectedFetches += expectedDownloadFilenames.length * 2;
      } else {
        expectedFetches += expectedDownloadFilenames.length;
      }
      expectLastCallToDownloadsToContain(downloadSpy, expectedZipFilename, expectedDownloadFilenames);
      expect(fetchSpy).toBeCalledTimes(expectedFetches);
    }

    expect(dataStore.histogramData).toEqual([]);
    expect(dataStore.summaryTableData).toEqual([]);

    // Initial data
    expectedFetches += 2;
    await vi.waitFor(() => {
      expect(dataStore.isLoading).toBe(false);
      expect(dataStore.histogramData).toHaveLength(histCountsDeathsDiseaseLog.length);
      expect(dataStore.histogramData[0]).toEqual(expect.objectContaining({
        disease: "Typhoid",
        location: "global",
        Counts: 2,
        lower_bound: expect.closeTo(-1, 0),
        upper_bound: expect.closeTo(-1, 0),
      }));
      expect(dataStore.summaryTableData).toHaveLength(summaryDeathsDisease.length);
      expect(dataStore.summaryTableData[0]).toEqual(expect.objectContaining({
        disease: "COVID-19",
        lower_95: expect.closeTo(0.1, 1),
        upper_95: expect.closeTo(0.2, 1),
        mean_value: expect.closeTo(0.1, 1),
        median_value: expect.closeTo(0.1, 1),
      }));
      expect(fetchSpy).toBeCalledTimes(expectedFetches);
      expectLastNFetchesToContain(fetchSpy, [
        "./data/json/hist_counts_deaths_disease_log.json",
        "./data/json/summary_table_deaths_disease.json",
      ]);
    });
    await doAndExpectDownload(false, "", ["summary_table_deaths_disease.csv"]);

    // Change options: round 1
    expect(appStore.exploreBy).toEqual("location");
    expect(appStore.focus).toEqual("global");
    appStore.focus = "Middle Africa";
    expectedFetches += 4;
    appStore.burdenMetric = BurdenMetric.DALYS;
    appStore.logScaleEnabled = false;
    appStore.splitByActivityType = true;

    await vi.waitFor(() => {
      expect(dataStore.isLoading).toBe(false);
      expect(dataStore.histogramData).toHaveLength(
        histCountsDalysDiseaseSubregionActivityType.length + histCountsDalysDiseaseActivityType.length
      );
      expect(dataStore.summaryTableData).toHaveLength(
        summaryDalysDiseaseSubregionActivityType.length + summaryDalysDiseaseActivityType.length
      );
    }, { timeout: 3000 });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNFetchesToContain(fetchSpy, [
      "./data/json/hist_counts_dalys_disease_subregion_activity_type.json",
      "./data/json/hist_counts_dalys_disease_activity_type.json",
      "./data/json/summary_table_dalys_disease_subregion_activity_type.json",
      "./data/json/summary_table_dalys_disease_activity_type.json",
    ]);
    await doAndExpectDownload(
      true,
      "summary_tables_dalys_disease_activity_type_subregion_global.zip",
      [
        "summary_table_dalys_disease_subregion_activity_type.csv",
        "summary_table_dalys_disease_activity_type.csv"
      ],
    );

    // Check that location columns include both global and subregional.
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
      expect(dataStore.isLoading).toBe(false);
      expect(dataStore.histogramData).toHaveLength(
        histCountsDeathsDiseaseSubregionActivityType.length + histCountsDeathsDiseaseActivityType.length
      );
      expect(dataStore.summaryTableData).toHaveLength(
        summaryDeathsDiseaseSubregionActivityType.length + summaryDeathsDiseaseActivityType.length
      );
    }, { timeout: 3000 });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNFetchesToContain(fetchSpy, [
      "./data/json/hist_counts_deaths_disease_subregion_activity_type.json",
      "./data/json/hist_counts_deaths_disease_activity_type.json",
      "./data/json/summary_table_deaths_disease_subregion_activity_type.json",
      "./data/json/summary_table_deaths_disease_activity_type.json",
    ]);
    await doAndExpectDownload(
      true,
      "summary_tables_deaths_disease_activity_type_subregion_global.zip",
      [
        "summary_table_deaths_disease_subregion_activity_type.csv",
        "summary_table_deaths_disease_activity_type.csv"
      ],
    );

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
      expect(dataStore.isLoading).toBe(false);
      expect(dataStore.histogramData).toHaveLength(
        histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length + histCountsDalysDiseaseLog.length
      );
      expect(dataStore.summaryTableData).toHaveLength(
        summaryDalysDiseaseSubregion.length + summaryDalysDiseaseCountry.length + summaryDalysDisease.length
      );
    }, { timeout: 3000 });
    expect(fetchSpy).toBeCalledTimes(expectedFetches);
    expectLastNFetchesToContain(fetchSpy, [
      "./data/json/hist_counts_dalys_disease_subregion_log.json",
      "./data/json/hist_counts_dalys_disease_country_log.json",
      "./data/json/hist_counts_dalys_disease_log.json",
      "./data/json/summary_table_dalys_disease_subregion.json",
      "./data/json/summary_table_dalys_disease_country.json",
      "./data/json/summary_table_dalys_disease.json",
    ]);
    await doAndExpectDownload(
      true,
      "summary_tables_dalys_disease_country_subregion_global.zip",
      [
        "summary_table_dalys_disease_subregion.csv",
        "summary_table_dalys_disease_country.csv",
        "summary_table_dalys_disease.csv"
      ],
    );
  }, 10000);

  it('should store errors on fetch, and clear them when filenames change', async () => {
    server.use(
      http.get("./data/json/hist_counts_deaths_disease_log.json", async () => {
        return HttpResponse.error();
      }),
    );
    const appStore = useAppStore();
    const dataStore = useDataStore();

    expect(dataStore.dataErrors).toHaveLength(0);

    const fetchSpy = vi.spyOn(global, 'fetch')
    await vi.waitFor(() => {
      expect(fetchSpy).toBeCalled();
      expect(dataStore.dataErrors).toEqual([expect.objectContaining(
        { message: `Error loading data from path: ./data/json/hist_counts_deaths_disease_log.json. TypeError: Failed to fetch` }
      )]);
    });

    expect(dataStore.histogramData).toHaveLength(0);

    appStore.logScaleEnabled = false;
    await vi.waitFor(() => {
      expect(dataStore.histogramData).not.toHaveLength(0);
      expect(dataStore.dataErrors).toHaveLength(0);
    });
  });

  it('should store errors on fetch for non-OK HTTP statuses', async () => {
    server.use(
      http.get("./data/json/hist_counts_deaths_disease_log.json", async () => {
        return HttpResponse.json(null, { status: 404 });
      }),
    );
    const dataStore = useDataStore();

    expect(dataStore.dataErrors).toEqual([]);

    const fetchSpy = vi.spyOn(global, 'fetch')
    await vi.waitFor(() => {
      expect(fetchSpy).toBeCalled();
      expect(dataStore.dataErrors).toEqual([expect.objectContaining(
        { message: `Error loading data from path: ./data/json/hist_counts_deaths_disease_log.json. Error: HTTP 404: Not Found` }
      )]);
    });

    expect(dataStore.histogramData).toEqual([]);
  });

  it('should store errors on download failure', async () => {
    const dataStore = useDataStore();

    const downloadSpy = vi.spyOn(downloadModule, 'downloadCsvAsSingleOrZip')
      .mockRejectedValueOnce(new Error("Simulated download failure"));

    expect(dataStore.dataErrors).toEqual([]);

    await dataStore.downloadSummaryTables();

    expect(downloadSpy).toHaveBeenCalled();
    expect(dataStore.dataErrors).toEqual([expect.objectContaining(
      { message: expect.stringMatching(/Error downloading summary tables.*Simulated download failure/) }
    )]);
  });

  it('getSummaryDataRow returns correct summary data row for given metadata', async () => {
    const appStore = useAppStore();
    const dataStore = useDataStore();

    // Wait for initial data load.
    await vi.waitFor(() => {
      expect(dataStore.isLoading).toBe(false);
    });
    expect(dataStore.histogramData).toHaveLength(histCountsDeathsDiseaseLog.length);

    appStore.exploreBy = "disease";
    appStore.focus = "Cholera";

    const row = dataStore.getSummaryDataRow({ row: "Cholera", withinBand: "global" });
    expect(row).toEqual(expect.objectContaining({
      disease: "Cholera",
      location: "global",
      mean_value: expect.closeTo(0.2, 1),
    }));
  });
});
