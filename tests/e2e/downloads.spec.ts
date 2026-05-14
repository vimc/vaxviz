import { expect, Download } from '@playwright/test';
import { test } from './fixtures/interceptNetworkRequests.ts';
import { doDownload, selectFocus } from './utils.ts';

const readDownloadedFile = async (download: Download) => {
  const readStream = await download.createReadStream();
  let fileContents = "";
  readStream.on("readable", () => {
    let chunk: string;
    while (null !== (chunk = readStream.read())) {
      fileContents += chunk;
    }
  });
  await new Promise((resolve) => {
    readStream.on("end", resolve);
  });
  return fileContents;
};

test.describe("Downloads", () => {
  // Webkit downloads don't work in playwright, but they have been manually tested in Safari 26.2
  // on an iPhone running iOS 26.2.1.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(({ browserName }) => browserName === "webkit", "Skipping Downloads tests for webkit");

  test("can download individual files", async ({ page }) => {
    await page.goto('/');

    const download = await doDownload(page, 1);
    expect(download.suggestedFilename()).toBe("summary_table_deaths_disease.csv");

    const fileContents = await readDownloadedFile(download);
    expect(fileContents).toContain('"disease","mean_value","lower_95","upper_95","median_value"');

    // Set burden metric to DALYs, and split plot by activity type, and check download again
    const dalysRadio = page.getByRole("radio", { name: "DALYs averted" });
    await dalysRadio.click();
    const activityTypeToggle = page.locator("label").filter({ hasText: "Split by activity type" });
    const activityTypeCheckbox = activityTypeToggle.locator('input[type="checkbox"]').first();
    await activityTypeToggle.click();
    await expect(activityTypeCheckbox).toBeChecked();

    const download2 = await doDownload(page, 1);
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

    const download = await doDownload(page, 3);
    expect(download.suggestedFilename()).toBe("vaxviz_download.zip");
  });

  test("can download all summary table files as a zip", async ({ page }) => {
    await page.goto('/');

    await page.getByRole("button", { name: "Downloads" }).click();
    await page.getByRole('button', { name: "Other downloads" }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: "Download all available files" }).click();
    const download = await downloadPromise;
    // Wait for the download process to complete
    await download.path();
    expect(download.suggestedFilename()).toBe("vaxviz_download.zip");
  });

  test("can download a custom selection of files using the filters", async ({ page }) => {
    await page.goto('/');

    await page.getByRole("button", { name: "Downloads" }).click();
    await page.getByRole('button', { name: "Other downloads" }).click();

    await page.getByRole('checkbox', { name: 'DALYs averted' }).check();
    await page.getByRole('checkbox', { name: 'By country' }).check();
    await page.getByRole('checkbox', { name: 'Split', exact: true }).check();
    await page.getByRole('button', { name: 'Select all files matching filters' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download 1 selected file' }).click();
    const download = await downloadPromise;
    // Wait for the download process to complete
    await download.path();
    expect(download.suggestedFilename()).toBe("summary_table_dalys_disease_activity_type_country.csv");

    const fileContents = await readDownloadedFile(download);
    expect(fileContents).toContain('"disease","activity_type","country","mean_value","lower_95","upper_95","median_value"');
  });

  test("can download all files relating to some selected locations", async ({ page }) => {
    await page.goto('/');

    // Set focus to a country and subregion
    const geographyRadio = page.getByRole("radio", { name: "Geography" });
    await geographyRadio.click();
    await selectFocus(page, "Oceania");

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole("button", { name: "Downloads" }).click();
    await page.getByRole('button', { name: "Download location-specific estimates" }).click();
    await page.getByRole('button', { name: "Download estimates" }).click();
    const download = await downloadPromise;
    // Wait for the download process to complete
    await download.path();
    expect(download.suggestedFilename()).toBe("vaxviz_download_Oceania.zip");
  });
});
