import { expect, type Page } from "@playwright/test";

export const TEST_PASSWORD = "samplepassword";

/**
 * Signs up a fresh email account, waits for the signed-in landing page, and
 * returns the account's email.
 */
export async function signUp(page: Page, name = "Test User") {
  const email = `user${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;
  // Submitting before hydration falls back to a native POST that reloads
  // /signup (see docs/ui-patterns.md). WebKit hydrates the dev build slowly
  // enough to hit that, so wait for the page's scripts to finish loading.
  await page.goto("/signup", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Name" }).fill(name);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { exact: true, name: "Sign Up" }).click();
  // Landing on an (auth) route proves the session exists; its layout sends
  // anonymous visitors to /. The first visit compiles the route under
  // `next dev`, which can outlast the default 5s expect timeout.
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 30_000 });
  return email;
}
