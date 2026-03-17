import { test as base } from '@playwright/test';
import { locationURL } from '../../../src/utils/externalURLs.ts';

// Mock network requests to avoid polluting analytics or straining quotas.
// This is required for e2e tests that use a non-dev, non-test value for NODE_ENV,
// as when running in CI.
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
