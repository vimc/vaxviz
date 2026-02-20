import { test, expect } from '@playwright/test';

test('posthog is initialized and makes requests to PostHog API', async ({ page }) => {
  // Intercept all requests to the PostHog API host and respond with an empty
  // JSON body so the test doesn't depend on external services being reachable.
  const posthogRequests: string[] = [];
  await page.route(/eu.*\.i\.posthog\.com/, (route) => {
    posthogRequests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/');

  // PostHog calls its API host during initialization (e.g. /flags/ to fetch
  // feature flags, or /config to fetch remote configuration).  Wait until we
  // observe at least one request to the PostHog host.
  await expect(async () => {
    expect(posthogRequests.length).toBeGreaterThan(0);
  }).toPass({ timeout: 10_000 });
});
