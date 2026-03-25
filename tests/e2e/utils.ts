import { expect, Page } from "@playwright/test";

export const selectFocus = async (page: Page, optionLabel: string) => {
  await page.click(".dropdown-icon");
  const option = page.locator(`.menu .menu-option:has-text('${optionLabel}')`);
  await option.scrollIntoViewIfNeeded();
  await expect(option).toBeVisible();
  await option.click();
};
