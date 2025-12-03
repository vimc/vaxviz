import { test, expect } from '@playwright/test';

test('visits the app root url and selects a focus disease', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Burden metric')).toBeVisible();

  const diseaseOption = "Measles";
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${diseaseOption}')`);
  await expect(option).toBeVisible();
  await option.click();

  await expect(page.getByRole("combobox", { name: "Focus disease:" }).locator(".single-value"))
    .toHaveText(diseaseOption);
});
