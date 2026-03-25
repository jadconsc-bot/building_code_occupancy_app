import { type Page, expect } from "@playwright/test";

const DEV_EMAIL = "jadconsc@gmail.com";
const DEV_PASSWORD = "De3251ab";

/**
 * Log in via the dev auth API and set the session cookie.
 * Works regardless of whether the login page is shown.
 */
export async function loginAsDev(page: Page): Promise<void> {
  const response = await page.request.post("/api/dev-auth/login", {
    data: { email: DEV_EMAIL, password: DEV_PASSWORD },
  });

  if (!response.ok()) {
    throw new Error(
      `Dev login failed: ${response.status()} ${await response.text()}`
    );
  }

  const { token } = await response.json();
  await page.context().addCookies([
    {
      name: "dev-session",
      value: token,
      domain: "localhost",
      path: "/",
      maxAge: 86400,
    },
  ]);
}

/**
 * Navigate to a route and wait for the page to settle.
 */
export async function goto(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for a Sonner toast to appear containing the given text.
 * Sonner renders toasts in a [data-sonner-toaster] element.
 */
export async function expectToast(
  page: Page,
  text: string | RegExp,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout ?? 8_000;
  const toastLocator = page.locator("[data-sonner-toaster] li");
  await expect(toastLocator.filter({ hasText: text })).toBeVisible({
    timeout,
  });
}

/**
 * Wait for any Sonner toast to appear and return its text.
 */
export async function waitForAnyToast(
  page: Page,
  timeout = 8_000
): Promise<string> {
  const toastLocator = page.locator("[data-sonner-toaster] li").first();
  await toastLocator.waitFor({ state: "visible", timeout });
  return (await toastLocator.textContent()) ?? "";
}

/**
 * Click a button by its visible label text.
 */
export async function clickButton(page: Page, label: string): Promise<void> {
  await page.getByRole("button", { name: label }).click();
}

/**
 * Collect all console errors emitted during a page visit.
 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

/**
 * Assert that no unexpected console errors were logged.
 * Filters out known benign browser/extension errors.
 */
export function assertNoConsoleErrors(errors: string[]): void {
  const filtered = errors.filter((e) => {
    // Ignore browser extension noise and React DevTools
    if (e.includes("Extension context invalidated")) return false;
    if (e.includes("ResizeObserver loop")) return false;
    if (e.includes("Non-Error promise rejection")) return false;
    return true;
  });
  expect(filtered, `Unexpected console errors: ${filtered.join("\n")}`).toHaveLength(0);
}

/**
 * Wait for a dialog/modal to become visible.
 */
export async function waitForDialog(page: Page, title: string): Promise<void> {
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByRole("dialog").getByText(title, { exact: false })
  ).toBeVisible({ timeout: 3_000 });
}

/**
 * Close the open dialog by clicking Cancel or pressing Escape.
 */
export async function closeDialog(page: Page): Promise<void> {
  const cancelBtn = page
    .getByRole("dialog")
    .getByRole("button", { name: /cancel/i });
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 3_000 });
}
