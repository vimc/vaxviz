import { test as base } from '@playwright/test';
import { locationURL } from '../../../src/utils/externalURLs.ts';

// Mock network requests to avoid polluting analytics or straining quotas.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(locationURL, async (route) => {
      await route.fulfill({
        json: { country: 'Testland' },
      });
    });
    await page.route(/https:\/\/.*\.posthog\.com\/.*/, async (route) => {
      await route.fulfill({});
    });
    await use(page);
  },
});
