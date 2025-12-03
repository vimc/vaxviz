import { test, expect } from '@playwright/test';

test('visits the app root url and selects a focus geography', async ({ page }) => {
  await page.goto('/');

  const geographyOption = "All 117 VIMC countries";
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${geographyOption}')`);
  await expect(option).toBeVisible();
  await option.click();

  await expect(page.getByRole("combobox", { name: "Focus Geography" }).locator(".single-value"))
    .toHaveText(geographyOption);
});
