import { expect, Page } from "@playwright/test";

export const selectFocus = async (page: Page, optionLabel: string) => {
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${optionLabel}')`);
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
};

export const getCheckboxWithinLabel = (page: Page, labelText: string) =>
  page.locator("label").filter({ hasText: labelText }).locator('input[type="checkbox"]').first();

export const getCheckboxLabel = (page: Page, labelText: string) =>
  page.locator("label").filter({ hasText: labelText }).first();
