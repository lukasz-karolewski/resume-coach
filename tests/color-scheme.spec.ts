import { expect, type Page, test } from "@playwright/test";

// The app only ships a light theme, so a phone in dark mode must render it
// unchanged rather than mixing dark-mode text colors into light surfaces.
async function bodyTextColor(page: Page) {
  await page.goto("/");
  return page.evaluate(() => getComputedStyle(document.body).color);
}

test("renders the same text color when the OS prefers dark mode", async ({
  browser,
}) => {
  const light = await browser.newPage({ colorScheme: "light" });
  const dark = await browser.newPage({ colorScheme: "dark" });

  expect(await bodyTextColor(dark)).toBe(await bodyTextColor(light));

  await light.close();
  await dark.close();
});
