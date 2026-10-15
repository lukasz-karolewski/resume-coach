import { expect, test } from "@playwright/test";

test("signup page renders the email signup form", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
  await expect(
    page.getByRole("button", { exact: true, name: "Sign Up" }),
  ).toBeVisible();
});

test("test signup", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("textbox", { name: "Name" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("lukasz");
  await page.getByRole("textbox", { name: "Name" }).press("Tab");
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(`lukasz${Math.floor(Math.random() * 10000)}@test.com`);
  await page.getByRole("textbox", { name: "Email" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("samplepassword");
  await page.getByRole("button", { exact: true, name: "Sign Up" }).click();
  // Landing on an (auth) route proves the session exists; its layout sends
  // anonymous visitors to /. The first visit compiles the route under
  // `next dev`, which can outlast the default 5s expect timeout.
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
