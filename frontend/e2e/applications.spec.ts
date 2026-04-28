// frontend/e2e/applications.spec.ts
import { test, expect } from "@playwright/test";

async function navigateSPA(page: any, path: string) {
  await page.evaluate((p: string) => {
    const app = (document.querySelector("#app") as any).__vue_app__;
    app.config.globalProperties.$router.push(p);
  }, path);
  await page.waitForURL(new RegExp(path.replace("/", "\\/")));
}

test.describe("Page Applications", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth + API
    await page.route("**/api/v1/auth/status", (route) =>
      route.fulfill({
        json: { status: "connected" },
      }),
    );
    await page.route("**/api/v1/metrics/**", (route) =>
      route.fulfill({ status: 200, body: "" }),
    );
    await page.route("**/api/v1/visits", (route) =>
      route.fulfill({ json: { total24h: 0, topApps: [] } }),
    );
    await page.route("**/api/v1/apps", (route) =>
      route.fulfill({
        json: [
          {
            id: "1",
            repoName: "my-app",
            repoUrl: "https://github.com/voikyrioh/my-app",
            displayName: "My App",
            type: "backend",
            containerName: "my-app",
            configured: true,
            lastSyncedAt: null,
            createdAt: "2026-01-01",
            tags: [{ id: "t1", category: "database", label: "PostgreSQL", color: "#336791" }],
            deployStatus: { conclusion: "success", runAt: null },
            containerStatus: "running",
          },
          {
            id: "2",
            repoName: "unconfigured-app",
            repoUrl: "https://github.com/voikyrioh/unconfigured-app",
            displayName: null,
            type: null,
            containerName: null,
            configured: false,
            lastSyncedAt: null,
            createdAt: "2026-01-01",
            tags: [],
            deployStatus: null,
            containerStatus: null,
          },
        ],
      }),
    );
    await page.route("**/api/v1/tags", (route) =>
      route.fulfill({
        json: [
          { id: "t1", category: "database", label: "PostgreSQL", color: "#336791" },
          { id: "t2", category: "database", label: "Redis", color: "#DC382D" },
        ],
      }),
    );
    // Auth dance: full page load → router guard → /connexion → LoginPage auto-detects
    // connected status → setAuthenticated(true) → router.push("/dashboard")
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    // Navigate to /applications via Vue Router (no full reload → auth state preserved)
    await navigateSPA(page, "/applications");
  });

  test("affiche la liste des applications", async ({ page }) => {
    await expect(page.getByText("Applications")).toBeVisible();
    await expect(page.getByText("My App")).toBeVisible();
    await expect(page.getByText("unconfigured-app").first()).toBeVisible();
  });

  test("affiche le badge 'À configurer' pour une app non configurée", async ({ page }) => {
    await expect(page.getByText("À configurer")).toBeVisible();
  });

  test("affiche les états live pour une app configurée", async ({ page }) => {
    await expect(page.getByText("OK")).toBeVisible();
    await expect(page.getByText("Running")).toBeVisible();
  });

  test("ouvre la modale au clic sur une app non configurée", async ({ page }) => {
    await page.locator(".app-row__display", { hasText: "unconfigured-app" }).click();
    await expect(page.getByText("Configurer l'application")).toBeVisible();
  });

  test("bouton Synchroniser déclenche POST /api/v1/apps/sync", async ({ page }) => {
    let syncCalled = false;
    await page.route("**/api/v1/apps/sync", (route) => {
      syncCalled = true;
      route.fulfill({ json: [] });
    });
    await page.getByText("Synchroniser").click();
    await expect(() => expect(syncCalled).toBe(true)).toPass();
  });

  test("soumettre la modale appelle PUT /api/v1/apps/:id", async ({ page }) => {
    let configureCalled = false;
    await page.route("**/api/v1/apps/2", (route) => {
      configureCalled = true;
      route.fulfill({
        json: {
          id: "2",
          repoName: "unconfigured-app",
          repoUrl: "https://github.com/voikyrioh/unconfigured-app",
          displayName: "Unconfigured App",
          type: "backend",
          containerName: "unconfigured-app",
          configured: true,
          lastSyncedAt: null,
          createdAt: "2026-01-01",
          tags: [],
          deployStatus: null,
          containerStatus: "unknown",
        },
      });
    });

    await page.locator(".app-row__display", { hasText: "unconfigured-app" }).click();
    await page.getByTestId("input-name").fill("Unconfigured App");
    await page.getByTestId("type-backend").click();
    await page.getByTestId("input-container").fill("unconfigured-app");
    await page.getByTestId("save").click();
    await expect(() => expect(configureCalled).toBe(true)).toPass();
  });
});
