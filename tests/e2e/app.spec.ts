import { test, expect, Page } from '@playwright/test';
import histCountsDeathsDiseaseLog from "../../public/data/json/hist_counts_deaths_disease_log.json" with { type: "json" };
import histCountsDalysDiseaseSubregionActivityType from "../../public/data/json/hist_counts_dalys_disease_subregion_activity_type.json" with { type: "json" };
import histCountsDalysDiseaseActivityType from "../../public/data/json/hist_counts_dalys_disease_activity_type.json" with { type: "json" };
import histCountsDeathsDiseaseSubregionActivityType from "../../public/data/json/hist_counts_deaths_disease_subregion_activity_type.json" with { type: "json" };
import histCountsDeathsDiseaseActivityType from "../../public/data/json/hist_counts_deaths_disease_activity_type.json" with { type: "json" };
import histCountsDalysDiseaseSubregionLog from "../../public/data/json/hist_counts_dalys_disease_subregion_log.json" with { type: "json" };
import histCountsDalysDiseaseCountryLog from "../../public/data/json/hist_counts_dalys_disease_country_log.json" with { type: "json" };
import histCountsDalysDiseaseLog from "../../public/data/json/hist_counts_dalys_disease_log.json" with { type: "json" };

type FocusType = "disease" | "location";

const expectSelectedFocus = async (page: Page, focusType: FocusType, expectedLabel: string) => {
  const selected = page.getByRole("combobox", {
    name: `Focus ${focusType === "disease" ? "Disease" : "Geography"}`
  }).locator(".single-value");
  await expect(selected).toHaveText(expectedLabel);
};

const selectFocus = async (page: Page, focusType: FocusType, optionLabel: string) => {
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${optionLabel}')`);
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
};

const globalOptionLabel = "All 117 VIMC countries";

test('visits the app root url, selects options, and loads correct data', async ({ page }) => {
  await page.goto('/');

  const diseaseRadio = page.getByRole("radio", { name: "Disease" });
  const geographyRadio = page.getByRole("radio", { name: "Geography" });
  const activityTypeCheckbox = page.getByRole("checkbox", { name: "Split by activity type" });
  const logScaleCheckbox = page.getByRole("checkbox", { name: "Log scale" });
  const dalysRadio = page.getByRole("radio", { name: "DALYs averted" });
  const deathsRadio = page.getByRole("radio", { name: "Deaths averted" });
  const chartWrapper = page.locator("#chartWrapper");

  // Initial selections
  await expect(diseaseRadio).not.toBeChecked();
  await expect(geographyRadio).toBeChecked();
  await expectSelectedFocus(page, "location", globalOptionLabel);
  await expect(activityTypeCheckbox).not.toBeChecked();
  await expect(logScaleCheckbox).toBeChecked();
  await expect(dalysRadio).not.toBeChecked();
  await expect(deathsRadio).toBeChecked();

  const dataAttr0 = await chartWrapper.getAttribute("data-test");
  const data0 = JSON.parse(dataAttr0!);
  expect(data0.histogramDataRowCount).toEqual(histCountsDeathsDiseaseLog.length);
  expect(data0.x).toBeNull();
  expect(data0.y).toBe("disease");
  expect(data0.withinBand).toBe("location");

  // Change options: round 1
  await selectFocus(page, "location", "Central and Southern Asia");
  await dalysRadio.click();
  await logScaleCheckbox.click();
  await activityTypeCheckbox.click();

  await expect(diseaseRadio).not.toBeChecked();
  await expect(geographyRadio).toBeChecked();
  await expectSelectedFocus(page, "location", "Central and Southern Asia");
  await expect(activityTypeCheckbox).toBeChecked();
  await expect(logScaleCheckbox).not.toBeChecked();
  await expect(dalysRadio).toBeChecked();
  await expect(deathsRadio).not.toBeChecked();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDalysDiseaseSubregionActivityType.length
        + histCountsDalysDiseaseActivityType.length,
      x: "activity_type",
      y: "disease",
      withinBand: "location",
    })
  );

  // Change options: round 2
  await diseaseRadio.click();
  await expectSelectedFocus(page, "disease", "Cholera");
  await selectFocus(page, "disease", "Measles");
  await deathsRadio.click();

  await expect(diseaseRadio).toBeChecked();
  await expect(geographyRadio).not.toBeChecked();
  await expectSelectedFocus(page, "disease", "Measles");
  await expect(activityTypeCheckbox).toBeChecked();
  await expect(logScaleCheckbox).not.toBeChecked();
  await expect(dalysRadio).not.toBeChecked();
  await expect(deathsRadio).toBeChecked();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount: histCountsDeathsDiseaseSubregionActivityType.length
        + histCountsDeathsDiseaseActivityType.length,
      x: "activity_type",
      y: "location",
      withinBand: "disease",
    })
  );

  // Change options: round 3
  await geographyRadio.click();
  await expectSelectedFocus(page, "location", globalOptionLabel);
  await selectFocus(page, "location", "AFG");
  await dalysRadio.click();
  await logScaleCheckbox.click();
  await activityTypeCheckbox.click();

  await expect(diseaseRadio).not.toBeChecked();
  await expect(geographyRadio).toBeChecked();
  await expectSelectedFocus(page, "location", "Afghanistan");
  await expect(activityTypeCheckbox).not.toBeChecked();
  await expect(logScaleCheckbox).toBeChecked();
  await expect(dalysRadio).toBeChecked();
  await expect(deathsRadio).not.toBeChecked();
  await expect(chartWrapper).toHaveAttribute("data-test",
    JSON.stringify({
      histogramDataRowCount:
        histCountsDalysDiseaseSubregionLog.length +
        histCountsDalysDiseaseCountryLog.length +
        histCountsDalysDiseaseLog.length,
      x: null,
      y: "disease",
      withinBand: "location",
    })
  );
});
