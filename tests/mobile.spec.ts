import { expect, type Page, test } from "@playwright/test";

// Viewport only: `isMobile` is unsupported in the Firefox project.
test.use({ viewport: { height: 844, width: 390 } });

async function expectNoHorizontalScroll(page: Page) {
  const { clientWidth, scrollWidth } = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
}

test("signed-in pages fit a phone-width viewport", async ({ page }) => {
  // Submitting before hydration falls back to a native POST that reloads
  // /signup (see docs/ui-patterns.md). WebKit hydrates the dev build slowly
  // enough to hit that, so wait for the page's scripts to finish loading.
  await page.goto("/signup", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Name" }).fill("Mobile Tester");
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(`mobile${Date.now()}@test.com`);
  await page.getByRole("textbox", { name: "Password" }).fill("samplepassword");
  await page.getByRole("button", { exact: true, name: "Sign Up" }).click();
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 30_000 });

  // A tracked application renders the jobs table, the widest piece of UI.
  await page.getByRole("button", { name: "Add application" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Company").fill("Acme Corporation International");
  await dialog
    .getByLabel("Position")
    .fill("Senior Staff Software Engineer, Platform Infrastructure");
  await dialog
    .getByLabel("Job posting URL")
    .fill("https://acme.example.com/jobs/123");
  await dialog.getByRole("button", { name: "Add application" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button", { name: /^Edit Senior Staff Software Engineer/ }),
  ).toBeVisible();
  await expectNoHorizontalScroll(page);

  for (const path of ["/resume", "/profile"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);
  }
});
