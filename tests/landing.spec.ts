import { expect, test } from "@playwright/test";

import { signUp } from "./helpers";

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
  await signUp(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
