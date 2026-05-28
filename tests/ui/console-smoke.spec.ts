import { expect, test } from "@playwright/test";
import { applyAuthSession } from "./helpers/auth";

const roles = [
  { key: "mainAdmin" as const, label: "MAIN_ADMIN", routes: ["/dashboard/admin", "/dashboard/admin/leads", "/dashboard/admin/manage-users"] },
  { key: "manager" as const, label: "MANAGER", routes: ["/dashboard/admin", "/dashboard/admin/leads", "/dashboard/admin/manage-users"] },
  { key: "l1" as const, label: "L1", routes: ["/dashboard/admin", "/dashboard/admin/leads"] },
  { key: "l2" as const, label: "L2", routes: ["/dashboard/admin", "/dashboard/admin/leads"] },
];

for (const role of roles) {
  test(`${role.label} login flow shows no console errors`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        const text = message.text();
        if (text.includes("net::ERR_NETWORK_ACCESS_DENIED")) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    await applyAuthSession(page, role.key);

    for (const route of role.routes) {
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await page.waitForLoadState("networkidle");
    }

    expect(
      consoleErrors,
      consoleErrors.length ? `Console errors for ${role.label}:\n${consoleErrors.join("\n")}` : undefined
    ).toEqual([]);
  });
}
