import { expect, test } from "@playwright/test";
import { apiGet, apiPost, applyAuthSession } from "./helpers/auth";

test.describe("Notification bell and safe content", () => {
  test("Bell is visible for all supported roles and opens notification panel", async ({ page }) => {
    for (const role of ["mainAdmin", "manager", "l1", "l2"] as const) {
      await applyAuthSession(page, role);
      await page.goto("/dashboard/admin");
      const bellButton = page.getByRole("button", { name: /open notifications/i });
      await expect(bellButton).toBeVisible();
      await bellButton.click();
      await expect(page.getByText("Notifications", { exact: true })).toBeVisible();
    }
  });

  test("Clear all notifications removes only the current user's list", async ({ page, request }) => {
    const listsResponse = await apiGet(request, "mainAdmin", "/api/lists/with-counts");
    expect(listsResponse.ok()).toBeTruthy();
    const targetList = (await listsResponse.json())?.data?.[0];
    expect(targetList?.id).toBeTruthy();

    const uniqueSuffix = Date.now();
    const createResponse = await apiPost(request, "mainAdmin", "/api/leads", {
      list_id: targetList.id,
      fname: `Clear ${uniqueSuffix}`,
      lname: "Notifications",
      mobile: `96666${String(uniqueSuffix).slice(-5)}`,
      email: `clear.notifications.${uniqueSuffix}@vespera.local`,
    });
    expect(createResponse.status()).toBe(201);

    await applyAuthSession(page, "mainAdmin");
    await page.goto("/dashboard/admin");
    await page.getByRole("button", { name: /open notifications/i }).click();
    await expect(page.getByText(`A new lead has been added: Clear ${uniqueSuffix} Notifications`, { exact: false })).toBeVisible();
    const clearAllButton = page.getByRole("button", { name: /^Clear All$/i });
    await expect(clearAllButton).toBeVisible();
    await clearAllButton.click();
    await expect(page.getByText("Clear Notifications", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /^Clear All$/i }).last().click();
    await expect(page.getByText(`A new lead has been added: Clear ${uniqueSuffix} Notifications`, { exact: false })).toHaveCount(0);
  });

  test("L2 notification panel does not expose lead phone numbers", async ({ page, request }) => {
    const listsResponse = await apiGet(request, "mainAdmin", "/api/lists/with-counts");
    expect(listsResponse.ok()).toBeTruthy();
    const targetList = (await listsResponse.json())?.data?.[0];
    expect(targetList?.id).toBeTruthy();

    const uniqueSuffix = Date.now();
    const mobile = `95555${String(uniqueSuffix).slice(-5)}`;
    const createResponse = await apiPost(request, "mainAdmin", "/api/leads", {
      list_id: targetList.id,
      fname: `Notify ${uniqueSuffix}`,
      lname: "L2",
      mobile,
      email: `notify.l2.${uniqueSuffix}@vespera.local`,
    });
    expect(createResponse.status()).toBe(201);

    await applyAuthSession(page, "l2");
    await page.goto("/dashboard/admin");
    await page.getByRole("button", { name: /open notifications/i }).click();
    await expect(page.getByText("New Lead Added", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(mobile, { exact: false })).toHaveCount(0);
  });

  test("WhatsApp action respects lead phone visibility permissions", async ({ page }) => {
    await applyAuthSession(page, "l2");
    await page.goto("/dashboard/admin/leads");
    await expect(page.getByRole("button", { name: /open whatsapp/i })).toHaveCount(0);
  });
});
