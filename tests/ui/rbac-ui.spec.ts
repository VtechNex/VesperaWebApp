import { expect, test } from "@playwright/test";
import { applyAuthSession } from "./helpers/auth";

test.describe("Admin RBAC UI and route verification", () => {
  test("MAIN_ADMIN sees privileged navigation and direct routes resolve without 404", async ({ page }) => {
    await applyAuthSession(page, "mainAdmin");

    const dashboardResponse = await page.goto("/dashboard/admin");
    expect(dashboardResponse?.ok()).toBeTruthy();
    await expect(page.getByText("Dashboard", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Manage Users", { exact: true })).toBeVisible();
    await expect(page.getByText("Properties Media", { exact: true })).toBeVisible();

    const chartSection = page.getByText("Lead Stage Distribution", { exact: true }).first();
    await expect(chartSection).toBeVisible();
    await expect(page.locator(".recharts-wrapper")).toHaveCount(1);

    const routesToVerify = [
      { path: "/dashboard/admin/leads", heading: "Manage Leads", timeout: 5000 },
      { path: "/dashboard/admin/add-leads", heading: "Add a New Lead or Customer", timeout: 5000 },
      { path: "/dashboard/admin/manage-list", heading: "Manage Lists", timeout: 5000 },
      { path: "/dashboard/admin/settings/user-profile", heading: "User Profile", timeout: 5000 },
      { path: "/dashboard/admin/settings/company-profile", heading: "Primary Contact and Organization Details", timeout: 15000 },
      { path: "/dashboard/admin/properties-media", heading: "Property Portfolio Manager", timeout: 5000 },
    ];

    for (const route of routesToVerify) {
      const response = await page.goto(route.path);
      expect(response?.ok(), `Expected ${route.path} to resolve successfully`).toBeTruthy();
      await expect(page.getByText(route.heading, { exact: false }).first()).toBeVisible({ timeout: route.timeout });
    }
  });

  test("L1/Manager can view leads and add-leads but cannot reach restricted admin areas", async ({ page }) => {
    await applyAuthSession(page, "manager");

    await page.goto("/dashboard/admin/leads");
    await expect(page.getByText("Manage Leads", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /export/i })).toHaveCount(0);
    await expect(page.getByText("Manage Users", { exact: true })).toHaveCount(0);

    await page.goto("/dashboard/admin/add-leads");
    await expect(page.getByText("Add a New Lead or Customer", { exact: false })).toBeVisible();

    await page.goto("/dashboard/admin/manage-users");
    await expect(page.getByText("Access Restricted", { exact: false })).toBeVisible();
  });

  test("L2 cannot add leads, cannot export, and sees restricted phone text in lead UI", async ({ page }) => {
    await applyAuthSession(page, "l2");

    await page.goto("/dashboard/admin/leads");
    await expect(page.getByText("Manage Leads", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /export/i })).toHaveCount(0);
    await expect(page.getByText("Add Leads", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Restricted", { exact: false }).first()).toBeVisible();

    await page.goto("/dashboard/admin/add-leads");
    await expect(page.getByText("Access Restricted", { exact: false })).toBeVisible();
  });
});
