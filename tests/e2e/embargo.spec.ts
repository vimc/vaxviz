import { expect, Page } from '@playwright/test';
import { test } from './fixtures/interceptNetworkRequests.ts';

test.describe("Embargo view", () => {
  test("shows embargo notices and does not show vaxviz controls", async ({page}) => {
    await page.goto("http://localhost:5174");
    await expect(page.locator("#embargo")).toHaveText(
      /VIMC Vaxviz is embargoed until the publication of the related paper/);
    await expect(page.getByText(/Focus on:/)).not.toBeVisible()
    await expect(page.getByText(/Impact ratio \(per thousand vaccinated\)/)).not.toBeVisible();
    await expect(page.locator("header")).not.toBeVisible();
    await expect(page.locator("main")).not.toBeVisible();
  });
});
