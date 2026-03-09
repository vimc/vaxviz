import { expect, Page, BrowserContext } from '@playwright/test';
import { test } from './fixtures/interceptNetworkRequests.ts';

const expectNoCookiesToHaveBeenSet = async (page: Page) => {
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(0);
};

const expectAnalyticsDisablingSettingToBe = async (browserContext: BrowserContext, expectedValue?: string, baseURL?: string) => {
  const storage = await browserContext.storageState()
  const domainScopedLocalStorage = storage.origins.find((origin) => origin.origin === baseURL)?.localStorage
  const localStorageItem = domainScopedLocalStorage?.find((item) => item.name === 'analyticsDisabled');
  expect(localStorageItem?.value).toBe(expectedValue);
};

const expectDisplayedStatusToBe = async (page: Page, expectedStatus: "opted in" | "opted out") => {
  // Click the "Privacy" link in the header
  await page.click('text=Privacy');
  const optInStatus = page.getByTestId('privacyModalOptInStatus');
  await expect(optInStatus).toContainText(`You are currently ${expectedStatus}`);
}

const opt = async (inOrOut: "in" | "out", page: Page) => {
  await page.click(`text=Opt ${inOrOut === "in" ? "in to" : "out of"} data collection`);
  // Wait for page reload (triggered client-side)
  await page.waitForLoadState('load');
}

test.describe('Privacy settings', () => {
  // Posthog is only initialised in production.
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip(() => !process.env.CI);

  test('user can change data collection preferences', async ({ context, page, baseURL }) => {
    // Count requests to one of the endpoints Posthog queries on start-up, as a proxy for counting the number of times Posthog starts up.
    let posthogSetupCount: number = 0;
    page.on('request', async (request) => {
      if (request.url().match(/https:\/\/eu-assets\.i\.posthog\.com\/array\/.*\/config\.js/)) {
        posthogSetupCount += 1;
      }
    });

    let expectedPosthogSetupCount = 0;
    expect(posthogSetupCount).toBe(expectedPosthogSetupCount); // No Posthog requests before app starts.
    await expectNoCookiesToHaveBeenSet(page);

    await page.goto('/');

    expectedPosthogSetupCount++; // Posthog should initialise on app load, by default, if the user has expressed no preference.
    expect(posthogSetupCount).toBe(expectedPosthogSetupCount);
    await expectNoCookiesToHaveBeenSet(page);
    await expectAnalyticsDisablingSettingToBe(context, undefined, baseURL);
    await expectDisplayedStatusToBe(page, "opted in");

    await opt("out", page);

    await expectNoCookiesToHaveBeenSet(page);
    await expect(async () => {
      await expectAnalyticsDisablingSettingToBe(context, 'true', baseURL);
    }).toPass({ timeout: 5000 });
    await expectDisplayedStatusToBe(page, "opted out");
    // Posthog should now NOT have re-initialised on app load, respecting the localStorage setting that the user has opted out of analytics.
    // So the expected number of requests remains the same.
    expect(posthogSetupCount).toBe(expectedPosthogSetupCount);

    await opt("in", page);

    expectedPosthogSetupCount++; // Posthog should now go back to the behaviour of (re)initialising on app load.
    await expect(async () => {
      expect(posthogSetupCount).toBe(expectedPosthogSetupCount);
    }).toPass({ timeout: 5000 });
    await expectNoCookiesToHaveBeenSet(page);
    await expectAnalyticsDisablingSettingToBe(context, 'false', baseURL);
    await expectDisplayedStatusToBe(page, "opted in");
  });
});
