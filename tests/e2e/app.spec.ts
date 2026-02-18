import { test, expect, Page } from '@playwright/test';
import histCountsDeathsDiseaseLog from "../../public/data/json/hist_counts_deaths_disease_log.json" with { type: "json" };
import histCountsDalysDiseaseSubregionActivityType from "../../public/data/json/hist_counts_dalys_disease_subregion_activity_type.json" with { type: "json" };
import histCountsDalysDiseaseActivityType from "../../public/data/json/hist_counts_dalys_disease_activity_type.json" with { type: "json" };
import histCountsDeathsDiseaseSubregionActivityType from "../../public/data/json/hist_counts_deaths_disease_subregion_activity_type.json" with { type: "json" };
import histCountsDeathsDiseaseActivityType from "../../public/data/json/hist_counts_deaths_disease_activity_type.json" with { type: "json" };
import histCountsDalysDiseaseSubregionLog from "../../public/data/json/hist_counts_dalys_disease_subregion_log.json" with { type: "json" };
import histCountsDalysDiseaseCountryLog from "../../public/data/json/hist_counts_dalys_disease_country_log.json" with { type: "json" };
import histCountsDalysDiseaseLog from "../../public/data/json/hist_counts_dalys_disease_log.json" with { type: "json" };
import { doDownload, readDownloadedFile } from './utils.ts';

type FocusType = "disease" | "location";

const expectSingleSelectedFocus = async (page: Page, focusType: FocusType, expectedLabel: string) => {
  const selected = page.getByRole("combobox", {
    name: `Focus ${focusType === "disease" ? "Disease" : "Geography"}`
  }).locator(".single-value");
  await expect(selected).toHaveText(expectedLabel);
};

const expectMultiSelectedFocus = async (page: Page, focusType: FocusType, expectedLabels: string[]) => {
  const selected = page.getByRole("combobox", {
    name: `Focus ${focusType === "disease" ? "Disease" : "Geography"}`
  }).locator(".multi-value");
  const selectedCount = await selected.count();
  expect(selectedCount).toBe(expectedLabels.length);
  for (let i = 0; i < expectedLabels.length; i++) {
    await expect(selected.nth(i)).toHaveText(expectedLabels[i]);
  }
}

const selectFocus = async (page: Page, optionLabel: string) => {
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${optionLabel}')`);
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
};

const globalOptionLabel = "All 117 VIMC countries";

test('visits the app root url, selects options, and loads correct data', async ({ page, }) => {
  // Expect all data requests to have 'Cache-Control: no-cache' header in response
  // 'Cache-Control: no-cache' tells browsers and caches they can store a copy of a resource
  // but must revalidate it with the original server before using it for any subsequent request
  page.on('request', async (request) => {
    if (request.url().includes("/data/")) {
      const response = await request.response();
      const responseHeaders = response?.headers();
      const cacheControlHeader = responseHeaders?.["cache-control"] || "";
      // eslint-disable-next-line playwright/no-conditional-expect
      expect(cacheControlHeader).toEqual("no-cache");
    }
  });

  await page.goto('/');

  const diseaseRadio = page.getByRole("radio", { name: "Disease" });
  const geographyRadio = page.getByRole("radio", { name: "Geography" });
  const activityTypeCheckbox = page.getByRole("checkbox", { name: "Split by activity type" });
  const logScaleCheckbox = page.getByRole("checkbox", { name: "Log scale" });
  const dalysRadio = page.getByRole("radio", { name: "DALYs averted" });
  const deathsRadio = page.getByRole("radio", { name: "Deaths averted" });
  const chartWrapper = page.locator("#chartWrapper");
  const plotLegend = page.locator("#colorLegend");

  // Initial selections
  await expect(diseaseRadio).not.toBeChecked();
  await expect(geographyRadio).toBeChecked();
  await expectSingleSelectedFocus(page, "location", globalOptionLabel);
  await expect(activityTypeCheckbox).not.toBeChecked();
  await expect(logScaleCheckbox).toBeChecked();
  await expect(dalysRadio).not.toBeChecked();
  await expect(deathsRadio).toBeChecked();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDeathsDiseaseLog.length,
      lineCount: 14, // 14 diseases have global data for aggregated activity type.
      column: null,
      row: "disease",
      withinBand: "location",
    })
  );
  await expect(plotLegend.locator(".legend-label")).toHaveCount(14); // Colors per disease.

  // Change options: round 1
  await selectFocus(page, "Middle Africa");
  await dalysRadio.click();
  await logScaleCheckbox.click();
  await activityTypeCheckbox.click();

  await expect(diseaseRadio).not.toBeChecked();
  await expect(geographyRadio).toBeChecked();
  await expectSingleSelectedFocus(page, "location", "Middle Africa");
  await expect(activityTypeCheckbox).toBeChecked();
  await expect(logScaleCheckbox).not.toBeChecked();
  await expect(dalysRadio).toBeChecked();
  await expect(deathsRadio).not.toBeChecked();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDalysDiseaseSubregionActivityType.length
        + histCountsDalysDiseaseActivityType.length,
      lineCount: 44, // Not all diseases have data for all subregions and activity types.
      column: "activity_type",
      row: "disease",
      withinBand: "location",
    })
  );
  await expect(plotLegend.locator(".legend-label")).toHaveCount(2); // Colors for Middle Africa, and global.

  // Change options: round 2
  await diseaseRadio.click();
  await expectSingleSelectedFocus(page, "disease", "Cholera");
  await selectFocus(page, "Measles");
  await deathsRadio.click();

  await expect(diseaseRadio).toBeChecked();
  await expect(geographyRadio).not.toBeChecked();
  await expectSingleSelectedFocus(page, "disease", "Measles");
  await expect(activityTypeCheckbox).toBeChecked();
  await expect(logScaleCheckbox).not.toBeChecked();
  await expect(dalysRadio).not.toBeChecked();
  await expect(deathsRadio).toBeChecked();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDeathsDiseaseSubregionActivityType.length
        + histCountsDeathsDiseaseActivityType.length,
      lineCount: 22, // 10 applicable subregions with measles, + global, each with 2 activity types
      column: "activity_type",
      row: "location",
      withinBand: "disease",
    })
  );
  await expect(plotLegend.locator(".legend-label")).toHaveCount(11); // Colors per location: the 10 subregions, and global.

  // Change options: round 3
  await geographyRadio.click();
  await expectSingleSelectedFocus(page, "location", globalOptionLabel);
  await selectFocus(page, "AFG");
  await dalysRadio.click();
  await logScaleCheckbox.click();
  await activityTypeCheckbox.click();

  await expect(diseaseRadio).not.toBeChecked();
  await expect(geographyRadio).toBeChecked();
  await expectSingleSelectedFocus(page, "location", "Afghanistan");
  await expect(activityTypeCheckbox).not.toBeChecked();
  await expect(logScaleCheckbox).toBeChecked();
  await expect(dalysRadio).toBeChecked();
  await expect(deathsRadio).not.toBeChecked();
  const expectedHistogramRowCount =
    histCountsDalysDiseaseSubregionLog.length +
    histCountsDalysDiseaseCountryLog.length +
    histCountsDalysDiseaseLog.length;
  // 10 applicable diseases, each with 3 locations (AFG, subregion, global),
  // + 1 disease (JE) with only 2 locations (no country-level data).
  const expectedLineCount = 32;
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: expectedHistogramRowCount,
      lineCount: expectedLineCount,
      column: null,
      row: "disease",
      withinBand: "location",
    })
  );
  await expect(plotLegend.locator(".legend-label")).toHaveCount(3); // Colors per location

  // Change options: round 4 (filtering out via legend component)
  const subregionButton = page.getByTestId("Central and Southern AsiaButton");

  await subregionButton.click();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: expectedHistogramRowCount,
      lineCount: 21, // One fewer line per disease, as Central and Southern Asia subregion is now filtered out.
      column: null,
      row: "disease",
      withinBand: "location",
    })
  );

  // Change options: round 5 (unfiltering via legend component)
  await subregionButton.click();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: expectedHistogramRowCount,
      lineCount: expectedLineCount,
      column: null,
      row: "disease",
      withinBand: "location",
    })
  );

  // Change options: round 6 (multiple focuses: diseases)
  await diseaseRadio.click();
  await expectSingleSelectedFocus(page, "disease", "Cholera");

  // Enable multi-focus mode and select multiple diseases
  const multiFocusModeCheckbox = page.getByRole("checkbox", { name: "Allow multiple focus selections" });
  await multiFocusModeCheckbox.click();

  await selectFocus(page, "Measles");
  await expectMultiSelectedFocus(page, "disease", ["Cholera", "Measles"]);

  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseLog.length,
      lineCount: 18, // 7 locations with Cholera, 11 with Measles
      column: null,
      row: "location",
      withinBand: "disease",
    })
  );
  await expect(plotLegend.locator(".legend-label")).toHaveCount(2);

  // Change options: round 7 (multiple focuses: locations)
  await geographyRadio.click();
  await expectMultiSelectedFocus(page, "location", [globalOptionLabel]);

  // deselect global
  await selectFocus(page, globalOptionLabel);

  await selectFocus(page, "AFG");
  await selectFocus(page, "Eastern Africa");

  await expect(plotLegend.locator(".legend-label")).toHaveCount(2);

  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDalysDiseaseSubregionLog.length + histCountsDalysDiseaseCountryLog.length,
      lineCount: 23, // 10 diseases for Afghanistan, 13 for Eastern Africa
      column: null,
      row: "disease",
      withinBand: "location",
    })
  );
  await expect(plotLegend.locator(".legend-label")).toHaveCount(2);
});

test.describe("Downloads", () => {
  // Webkit downloads don't work in playwright, but they have been manually tested in Safari 26.2
  // on an iPhone running iOS 26.2.1.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(({ browserName }) => browserName === "webkit", "Skipping Downloads tests for webkit");

  test("can download individual files", async ({ page }) => {
    await page.goto('/');

    const button = page.getByRole("button", { name: "Download summary" });

    const download = await doDownload(page, button);
    expect(download.suggestedFilename()).toBe("summary_table_deaths_disease.csv");

    const fileContents = await readDownloadedFile(download);
    expect(fileContents).toContain('"disease","mean_value","lower_95","upper_95","median_value"');

    // Set burden metric to DALYs, and split plot by activity type, and check download again
    const dalysRadio = page.getByRole("radio", { name: "DALYs averted" });
    await dalysRadio.click();
    const activityTypeCheckbox = page.getByRole("checkbox", { name: "Split by activity type" });
    await activityTypeCheckbox.click();

    const download2 = await doDownload(page, button);
    expect(download2.suggestedFilename()).toBe("summary_table_dalys_disease_activity_type.csv");

    const fileContents2 = await readDownloadedFile(download2);
    expect(fileContents2).toContain('"disease","activity_type","mean_value","lower_95","upper_95","median_value"');
  });

  test("can download multiple files as a zip", async ({ page }) => {
    await page.goto('/');

    // Set focus to a country
    const geographyRadio = page.getByRole("radio", { name: "Geography" });
    await geographyRadio.click();
    await selectFocus(page, "Kenya");

    const button = page.getByRole("button", { name: "Download summary" });

    const download = await doDownload(page, button);
    expect(download.suggestedFilename()).toBe("summary_tables_deaths_disease_country_subregion_global.zip");
  });
});
