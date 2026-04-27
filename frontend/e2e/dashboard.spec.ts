import { test, expect } from "@playwright/test";

test.describe("Dashboard — métriques", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/status", (route) =>
      route.fulfill({ json: { status: "connected" } }),
    );
    await page.route("**/api/v1/metrics/live", (route) => {
      route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        body: 'data: {"cpu":42.3,"ram":{"used":3891,"total":8192}}\n\n',
      });
    });
    await page.route("**/api/v1/metrics/history**", (route) =>
      route.fulfill({ json: { cpu: [], ram: [] } }),
    );
    await page.route("**/api/v1/visits", (route) =>
      route.fulfill({
        json: {
          total24h: 1240,
          topApps: [
            { name: "portfolio", visits: 540 },
            { name: "api", visits: 310 },
          ],
        },
      }),
    );
  });

  test("affiche les sections métriques et visites", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator(".metric-card__title").filter({ hasText: "CPU" })).toBeVisible({ timeout: 5000 });
    await expect(page.locator(".metric-card__title").filter({ hasText: "RAM" })).toBeVisible();
    await expect(page.locator("text=Visites 24h")).toBeVisible();
  });

  test("affiche le total des visites", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=1 240").or(page.locator("text=1,240")).or(page.locator("text=1240"))).toBeVisible({ timeout: 5000 });
  });

  test("affiche les top apps", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("text=portfolio")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=api")).toBeVisible();
  });

  test("les boutons de plage temporelle sont présents", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("button:has-text('1h')")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("button:has-text('24h')")).toBeVisible();
    await expect(page.locator("button:has-text('7d')")).toBeVisible();
  });
});
