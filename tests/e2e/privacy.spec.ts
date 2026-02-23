import { test, expect, Page } from '@playwright/test';

const expectNoCookiesToHaveBeenSet = async (page: Page) => {
  const cookies = await page.context().cookies();
  expect(cookies).toHaveLength(0);
};

const expectAnalyticsDisablingSettingToBe = async (page: Page, expectedValue: string | null) => {
  const localStorageAnalyticsSetting = await page.evaluate(() => localStorage.getItem('analyticsDisabled'));
  expect(localStorageAnalyticsSetting).toBe(expectedValue);
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

test('user can change data collection preferences', async ({ page }) => {
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
  await expectAnalyticsDisablingSettingToBe(page, null);
  await expectDisplayedStatusToBe(page, "opted in");

  await opt("out", page);

  await expectNoCookiesToHaveBeenSet(page);
  await expectAnalyticsDisablingSettingToBe(page, 'true');
  await expectDisplayedStatusToBe(page, "opted out");
  // Posthog should now NOT have re-initialised on app load, respecting the localStorage setting that the user has opted out of analytics.
  // So the expected number of requests remains the same.
  expect(posthogSetupCount).toBe(expectedPosthogSetupCount);

  await opt("in", page);

  expectedPosthogSetupCount++; // Posthog should now go back to the behaviour of (re)initialising on app load.
  expect(posthogSetupCount).toBe(expectedPosthogSetupCount);
  await expectNoCookiesToHaveBeenSet(page);
  await expectAnalyticsDisablingSettingToBe(page, 'false');
  await expectDisplayedStatusToBe(page, "opted in");
});
