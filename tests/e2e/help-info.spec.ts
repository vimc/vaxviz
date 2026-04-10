import { expect, Page } from '@playwright/test';
import { test } from './fixtures/interceptNetworkRequests.ts';

const logScaleAlertText = 'Note: you are viewing estimates on a log 10 scale';
const helpWithLogScaleText = 'Help with log 10 scale';

const expectLogScaleHelpAlertToBeVisible = async (page: Page) => {
  const alert = page.getByRole('alert').filter({ hasText: logScaleAlertText });
  await expect(alert).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Learn more' })).toBeVisible();
  await expect(alert.getByRole('button', { name: 'Dismiss' })).toBeVisible();
};

const expectLogScaleHelpAlertNotToBeVisible = async (page: Page) => {
  await expect(page.getByRole('alert').filter({ hasText: logScaleAlertText })).toHaveCount(0);
};

test.describe('Help info alerts', () => {
  test('log scale help info is shown by default, can be dismissed, persists across visits, and can be restored', async ({ context, page }) => {
    await page.goto('/');

    // The log-scale help alert is shown by default.
    await expectLogScaleHelpAlertToBeVisible(page);

    // Dismiss the alert.
    await page.getByRole('alert').filter({ hasText: logScaleAlertText }).getByRole('button', { name: 'Dismiss' }).click();
    await expectLogScaleHelpAlertNotToBeVisible(page);
    await expect(page.getByText(helpWithLogScaleText)).toBeVisible();

    // On a fresh page visit in the same browser context, the dismissal should persist.
    const nextVisitPage = await context.newPage();
    await nextVisitPage.goto('/');

    await expectLogScaleHelpAlertNotToBeVisible(nextVisitPage);
    await expect(nextVisitPage.getByText(helpWithLogScaleText)).toBeVisible();
    
    // The alert can be brought back.
    await nextVisitPage.getByText(helpWithLogScaleText).click();
    await expectLogScaleHelpAlertToBeVisible(nextVisitPage);
    await expect(nextVisitPage.getByText(helpWithLogScaleText)).toHaveCount(0);

    await nextVisitPage.close();

    // On a fresh page visit in the same browser context, the undismissal should persist.
    const thirdVisitPage = await context.newPage();
    await thirdVisitPage.goto('/');

    await expectLogScaleHelpAlertToBeVisible(thirdVisitPage);
    await expect(thirdVisitPage.getByText(helpWithLogScaleText)).toHaveCount(0);

    await thirdVisitPage.close();
  });
});
