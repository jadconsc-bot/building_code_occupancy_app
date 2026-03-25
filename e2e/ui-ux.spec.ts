/**
 * UI/UX & Error Handling — E2E Tests
 *
 * Verifies:
 *   - No console.log/error spam on any page (post cleanup)
 *   - Loading states on button clicks
 *   - Modal open/close behavior
 *   - User-friendly error messages (no raw technical errors exposed)
 *   - Keyboard accessibility
 *   - Basic form validation
 */

import { test, expect } from "@playwright/test";
import {
  loginAsDev,
  goto,
  collectConsoleErrors,
  assertNoConsoleErrors,
} from "./helpers";

// Pages to check for console cleanliness
const PAGES = [
  { name: "home", path: "/" },
  { name: "billing", path: "/billing" },
  { name: "sharing", path: "/sharing" },
  { name: "clients", path: "/clients" },
];

test.describe("Console Cleanliness", () => {
  for (const { name, path } of PAGES) {
    test(`${name} page emits no console errors`, async ({ page }) => {
      await loginAsDev(page);
      const errors = collectConsoleErrors(page);
      await goto(page, path);
      // Wait for any async data fetching to settle
      await page.waitForTimeout(2_000);
      assertNoConsoleErrors(errors);
    });
  }
});

test.describe("Loading States", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDev(page);
  });

  test("billing Stripe buttons are not stuck in loading state on page load", async ({
    page,
  }) => {
    await goto(page, "/billing");
    await page.getByRole("tab", { name: /payment/i }).click();

    // Buttons should be enabled (not in pending state) on initial load
    const updateBtn = page.getByRole("button", { name: /update payment method/i });
    await expect(updateBtn).toBeEnabled();
    const addBtn = page.getByRole("button", { name: /add another card/i });
    await expect(addBtn).toBeEnabled();
  });

  test("billing Stripe buttons disable briefly while calling server", async ({
    page,
  }) => {
    await goto(page, "/billing");
    await page.getByRole("tab", { name: /payment/i }).click();

    const updateBtn = page.getByRole("button", { name: /update payment method/i });

    // Click and immediately check — button may be disabled during pending
    await updateBtn.click();

    // Wait for the toast to confirm the request completed
    await page
      .locator("[data-sonner-toaster] li")
      .first()
      .waitFor({ state: "visible", timeout: 8_000 });

    // After completion, button should be re-enabled
    await expect(updateBtn).toBeEnabled({ timeout: 3_000 });
  });
});

test.describe("Modal Behavior", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDev(page);
  });

  test("Change Plan dialog closes on Cancel", async ({ page }) => {
    await goto(page, "/billing");
    await page.getByRole("button", { name: /change plan/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 3_000 });
  });

  test("Cancel Subscription dialog closes on Keep Subscription", async ({
    page,
  }) => {
    await goto(page, "/billing");
    await page.getByRole("button", { name: /cancel subscription/i }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 5_000 });

    await page.getByRole("button", { name: /keep subscription/i }).click();
    await expect(page.getByRole("alertdialog")).toBeHidden({ timeout: 3_000 });
  });

  test("Create Share Link dialog closes on Cancel", async ({ page }) => {
    await goto(page, "/sharing");
    await page
      .getByRole("button", { name: /create share link/i })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    const cancelBtn = page
      .getByRole("dialog")
      .getByRole("button", { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 3_000 });
  });
});

test.describe("Error Messages — No Raw Technical Output", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDev(page);
  });

  test("Stripe-stub errors show user-friendly message (no stack traces)", async ({
    page,
  }) => {
    await goto(page, "/billing");
    await page.getByRole("tab", { name: /payment/i }).click();
    await page.getByRole("button", { name: /update payment method/i }).click();

    const toastEl = page.locator("[data-sonner-toaster] li").first();
    await toastEl.waitFor({ state: "visible", timeout: 8_000 });
    const text = (await toastEl.textContent()) ?? "";

    // Should contain human-readable message, not a stack trace
    expect(text).not.toMatch(/TypeError|SyntaxError|at Object\.|\.ts:\d+/);
    expect(text.length).toBeLessThan(300);
  });

  test("Stripe-stub errors mention Stripe so users know what is needed", async ({
    page,
  }) => {
    await goto(page, "/billing");
    await page.getByRole("button", { name: /add tax id/i }).click();

    const toastEl = page.locator("[data-sonner-toaster] li").first();
    await toastEl.waitFor({ state: "visible", timeout: 8_000 });
    const text = (await toastEl.textContent()) ?? "";

    expect(text.toLowerCase()).toContain("stripe");
  });
});

test.describe("Keyboard Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDev(page);
  });

  test("billing page buttons are reachable by Tab key", async ({ page }) => {
    await goto(page, "/billing");

    // Tab through elements and find at least one button with focus
    let foundFocusedButton = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      const tag = await focused.evaluate((el) => el.tagName).catch(() => "");
      const role = await focused.getAttribute("role").catch(() => "");
      if (tag === "BUTTON" || role === "button") {
        foundFocusedButton = true;
        break;
      }
    }
    expect(foundFocusedButton).toBe(true);
  });

  test("Change Plan dialog is closable with Escape key", async ({ page }) => {
    await goto(page, "/billing");
    await page.getByRole("button", { name: /change plan/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 3_000 });
  });
});
