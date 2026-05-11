import { expect, Download, Page } from "@playwright/test";

export const selectFocus = async (page: Page, optionLabel: string) => {
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${optionLabel}')`);
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
};

// Download the file(s) that are pre-selected by default, based on the plot controls
export const doDownload = async (page: Page, expectedNumberOfFiles: number): Promise<Download> => {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Downloads" }).click();
  await page.getByRole('button', { name: "Other downloads" }).click();
  await page.getByRole("button", { name: `Download ${expectedNumberOfFiles}` }).click();

  const download = await downloadPromise;

  // Wait for the download process to complete
  await download.path();

  await page.getByRole("button", { name: "close", exact: true }).click();

  return download;
};
