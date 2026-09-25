import { test, expect } from "@playwright/test";

// Retour client du 24/09 : nombre de semaines chargées configurable (4 à
// 26) sur la grille Planning, fenêtre visible toujours à 4 semaines,
// ascenseur horizontal au-delà — cf. BACKLOG story #24.

test.describe("Semaines chargées configurables (grille Planning)", () => {
  test("par défaut (4 semaines chargées = 4 visibles), aucun ascenseur horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto("/");
    const conteneur = page.locator("table").locator("..");
    const { scrollWidth, clientWidth } = await conteneur.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("à 12 semaines chargées, la grille déborde et un ascenseur apparaît", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /2026 ▾/ }).click();
    await page.locator("input[type=number]").fill("12");
    await page.locator("input[type=number]").blur();
    await page.mouse.click(700, 500);

    const conteneur = page.locator("table").locator("..");
    const { scrollWidth, clientWidth } = await conteneur.evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollWidth).toBeGreaterThan(clientWidth + 100);
  });

  test("les flèches défilent dans le lot chargé sans changer la période affichée", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/");
    await page.getByRole("button", { name: /2026 ▾/ }).click();
    await page.locator("input[type=number]").fill("12");
    await page.locator("input[type=number]").blur();
    await page.mouse.click(700, 500);

    const label = page.getByRole("button", { name: /2026 ▾/ });
    const avant = await label.innerText();

    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Semaine suivante" }).click();
      await page.waitForTimeout(300);
    }

    await expect(label).toHaveText(avant);
  });
});
