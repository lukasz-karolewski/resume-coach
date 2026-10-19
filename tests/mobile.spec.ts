import { expect, type Page, test } from "@playwright/test";

import { signUp } from "./helpers";

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
  await signUp(page, "Mobile Tester");

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

  // The profile editor's widest state is an open role card.
  await page.goto("/profile");
  await page.getByRole("button", { name: "Add role" }).click();
  await expect(page.getByLabel("Company")).toBeVisible();
  await expectNoHorizontalScroll(page);

  await page.goto("/resume");
  await page.getByRole("button", { name: "Create new resume" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .first()
    .fill("A Rather Long Senior Staff Software Engineer Resume");
  await page.getByRole("button", { name: "Create Resume" }).click();
  await expectNoHorizontalScroll(page);

  await page.locator("main a[href^='/resume/']").first().click();
  await expect(
    page.getByRole("textbox", { name: "Resume name" }),
  ).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("assistant fills the phone screen with its input in view", async ({
  page,
}) => {
  await signUp(page, "Mobile Tester");

  await page.getByRole("button", { name: "Open chat" }).click();
  const panel = page.getByTestId("assistant-panel");
  await expect(panel).toBeVisible();

  const viewport = page.viewportSize();
  expect(await panel.boundingBox()).toEqual({
    height: viewport?.height,
    width: viewport?.width,
    x: 0,
    y: 0,
  });
  await expect(page.getByRole("textbox", { name: /ask/i })).toBeInViewport();
});
