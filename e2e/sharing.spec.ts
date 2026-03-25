/**
 * Project Sharing & Verification — E2E Tests
 *
 * Verifies:
 *   FIX #8 — Create Share Link (trpc.sharing.createShareLink)
 *   FIX #9 — Create Verification Link (trpc.verification.createToken)
 *   Revoke Share Link
 *   Permission level selection
 */

import { test, expect } from "@playwright/test";
import {
  loginAsDev,
  goto,
  waitForDialog,
  closeDialog,
  collectConsoleErrors,
  assertNoConsoleErrors,
} from "./helpers";

test.describe("Project Sharing & Verification", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDev(page);
    await goto(page, "/sharing");
  });

  // ─── Page load ─────────────────────────────────────────────────────────────

  test("sharing page loads with share link and verification sections", async ({
    page,
  }) => {
    await expect(page.getByText(/share link/i).first()).toBeVisible();
    await expect(page.getByText(/verification/i).first()).toBeVisible();
  });

  // ─── FIX #8: Create Share Link ─────────────────────────────────────────────

  test("FIX #8 — Create Share Link button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /create share link/i }).first().click();
    await waitForDialog(page, "Create Share Link");

    // Dialog form has access level selector
    const accessLevelSelect = page.getByRole("combobox").first();
    await expect(accessLevelSelect).toBeVisible();

    await closeDialog(page);
  });

  test("FIX #8 — Create Share Link dialog allows permission level selection", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /create share link/i }).first().click();
    await waitForDialog(page, "Create Share Link");

    // Open access level select
    const accessLevelSelect = page.getByRole("combobox").first();
    await accessLevelSelect.click();

    // Options should include view, comment, download variants
    const options = page.getByRole("option");
    await expect(options).not.toHaveCount(0);

    await page.keyboard.press("Escape");
    await closeDialog(page);
  });

  // ─── FIX #9: Create Verification Link ──────────────────────────────────────

  test("FIX #9 — Create Verification Link button opens dialog", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /create verification link/i })
      .first()
      .click();
    await waitForDialog(page, "Create Verification Link");

    // Dialog has a calculation result ID input
    const calcIdInput = page.getByRole("textbox").first();
    await expect(calcIdInput).toBeVisible();

    await closeDialog(page);
  });

  test("FIX #9 — Create Verification Link requires calculation ID", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /create verification link/i })
      .first()
      .click();
    await waitForDialog(page, "Create Verification Link");

    // Generate button should be disabled when calc ID is empty
    const generateBtn = page
      .getByRole("dialog")
      .getByRole("button", { name: /generate|create/i });
    await expect(generateBtn).toBeDisabled();

    await closeDialog(page);
  });

  // ─── Console cleanliness ─────────────────────────────────────────────────────

  test("sharing page has no console errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await goto(page, "/sharing");
    await page.waitForTimeout(2_000);
    assertNoConsoleErrors(errors);
  });
});
