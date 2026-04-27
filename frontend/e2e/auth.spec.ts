import { test, expect, type BrowserContext, type Page } from "@playwright/test";

async function setupVirtualAuthenticator(page: Page, context: BrowserContext) {
  const cdpSession = await context.newCDPSession(page);
  await cdpSession.send("WebAuthn.enable", { enableUI: false });
  const { authenticatorId } = await cdpSession.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    },
  );
  return { cdpSession, authenticatorId };
}

test.describe("Auth — redirections", () => {
  test("redirige vers /connexion si non authentifié", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("affiche l'écran de connexion sur /connexion", async ({ page }) => {
    await page.goto("/connexion");
    // Attend que le spinner disparaisse
    await expect(page.locator(".login-page__loader")).not.toBeVisible({
      timeout: 5000,
    });
    // Soit setup soit login selon l'état de la DB
    const hasSetup = await page.locator("text=Configuration initiale").isVisible();
    const hasLogin = await page.locator("text=Connexion").isVisible();
    expect(hasSetup || hasLogin).toBe(true);
  });
});

test.describe("Auth — flow complet (Chromium uniquement)", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "WebAuthn virtual authenticator nécessite Chromium",
  );

  test("setup passkey → logout → login", async ({ page, context }) => {
    const { cdpSession, authenticatorId } = await setupVirtualAuthenticator(
      page,
      context,
    );

    // Naviguer vers la page de connexion
    await page.goto("/connexion");
    await expect(page.locator(".login-page__loader")).not.toBeVisible({
      timeout: 5000,
    });

    // Si déjà setup, on skip le setup
    const isSetupPage = await page
      .locator("text=Configuration initiale")
      .isVisible();

    if (isSetupPage) {
      // Entrer le mot de passe d'initialisation
      await page.fill('input[type="password"]', "test222&&");
      await page.click('button[type="submit"]');

      // Attendre la redirection vers /dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

      // Vérifier que le cookie JWT est présent et HttpOnly
      const cookies = await context.cookies();
      const jwtCookie = cookies.find((c) => c.name === "jwt");
      expect(jwtCookie).toBeDefined();
      expect(jwtCookie?.httpOnly).toBe(true);
      expect(jwtCookie?.sameSite).toBe("Strict");

      // Logout
      await page.click('button:has-text("Déconnexion")');
      await expect(page).toHaveURL(/\/connexion/, { timeout: 5000 });

      // Vérifier que le cookie est supprimé
      const cookiesAfterLogout = await context.cookies();
      const jwtAfterLogout = cookiesAfterLogout.find((c) => c.name === "jwt");
      expect(jwtAfterLogout).toBeUndefined();
    }

    // Login avec passkey
    await expect(page.locator("text=Connexion")).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Se connecter avec ma passkey")');

    // Attendre la redirection vers /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Vérifier cookie présent
    const cookiesAfterLogin = await context.cookies();
    const jwtAfterLogin = cookiesAfterLogin.find((c) => c.name === "jwt");
    expect(jwtAfterLogin).toBeDefined();
    expect(jwtAfterLogin?.httpOnly).toBe(true);

    // Cleanup
    await cdpSession.send("WebAuthn.removeVirtualAuthenticator", {
      authenticatorId,
    });
  });
});
