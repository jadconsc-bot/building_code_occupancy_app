import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.STAGING_TEST_EMAIL;
const PASSWORD = process.env.STAGING_TEST_PASSWORD;

test.skip(!EMAIL || !PASSWORD, 'Set STAGING_TEST_EMAIL and STAGING_TEST_PASSWORD to run this suite');

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  const identifier = page.locator('input[name="identifier"]');
  await identifier.waitFor({ timeout: 10_000 });
  await identifier.fill(EMAIL!);
  await page.getByRole('button', { name: /continue/i }).click();
  const password = page.locator('input[name="password"]');
  await password.waitFor({ timeout: 10_000 });
  await password.fill(PASSWORD!);
  await page.getByRole('button', { name: /continue|sign in/i }).click();
  await page.waitForURL(/dashboard|home\/reports|\/$/, { timeout: 15_000 });
}

async function signOut(page: Page) {
  const directButton = page.getByRole('button', { name: /sign out|log out/i });
  if (await directButton.isVisible().catch(() => false)) {
    await directButton.click();
  } else {
    await page.getByRole('button', { name: /account|profile/i }).click();
    await page.getByRole('menuitem', { name: /sign out|log out/i }).click();
  }
  await page.waitForURL(/\/$|sign-in/, { timeout: 10_000 });
}

async function fieldWrapper(page: Page, label: string) {
  return page.locator('label', { hasText: label }).first().locator('xpath=..');
}

async function fillNumber(page: Page, label: string, value: number) {
  await (await fieldWrapper(page, label)).locator('input').fill(String(value));
}

async function clickYesNo(page: Page, label: string, value: 'yes' | 'no') {
  const wrapper = await fieldWrapper(page, label);
  await wrapper.getByRole('button', { name: value === 'yes' ? 'Yes' : 'No', exact: true }).click();
}

async function selectOption(page: Page, label: string, optionLabel: string) {
  const wrapper = await fieldWrapper(page, label);
  await wrapper.getByRole('combobox').click();
  await page.getByRole('option', { name: optionLabel }).click();
}

test.describe('Staging smoke — auth + admin', () => {
  test('sign in, view admin Users tab, sign out', async ({ page }) => {
    await signIn(page);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('tab', { name: /users/i }).click();
    await expect(page.getByText(/invite user/i)).toBeVisible();
    await signOut(page);
  });
});

test.describe('Staging smoke — CIM-HOME-001 secondary suite flow', () => {
  test('fill secondary suite form, use term explainer, reach review + payment step', async ({ page }) => {
    await signIn(page);
    await page.goto('/home/secondary_suite');

    const emailGate = page.getByLabel(/email/i).first();
    if (await emailGate.isVisible().catch(() => false)) {
      await emailGate.fill(EMAIL!);
      await page.getByRole('button', { name: /continue/i }).click();
    }

    await selectOption(page, 'Province', 'British Columbia');
    await selectOption(page, 'Suite location', 'Basement');
    await fillNumber(page, 'Ceiling height', 6.5);
    await fillNumber(page, 'Bedrooms', 1);
    await clickYesNo(page, 'Separate entrance?', 'yes');
    await clickYesNo(page, 'Parking space?', 'yes');
    await clickYesNo(page, 'Kitchen?', 'yes');
    await clickYesNo(page, 'Full bathroom?', 'yes');
    await clickYesNo(page, 'Egress windows in sleeping areas?', 'yes');
    await fillNumber(page, 'Limiting distance', 1.7);
    await fillNumber(page, 'Exposing face area', 12);
    await fillNumber(page, 'Total opening area', 1.2);

    const helpButton = (await fieldWrapper(page, 'Limiting distance')).getByRole('button', {
      name: /explain limiting distance/i,
    });
    await helpButton.click();
    await expect(page.getByText(/general explanation/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/loading explanation/i)).toBeHidden({ timeout: 15_000 });

    await page.getByRole('button', { name: /see compliance results/i }).click();
    await expect(page.getByRole('heading', { name: /review your answers/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('British Columbia')).toBeVisible();
    await expect(page.getByText('Confirm & pay $29', { exact: false })).toBeVisible();
    await signOut(page);
  });
});
