import { expect, test } from "@playwright/test";

test("landing page is correct", async ({ page }) => {
  await page.goto("http://localhost:3000/signup");
  await expect(
    page.getByRole("heading", { name: "Create an Account" }),
  ).toBeVisible();
});

test("test signup", async ({ page }) => {
  await page.goto("http://localhost:3000/signup");
  await page.getByRole("textbox", { name: "Name" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("lukasz");
  await page.getByRole("textbox", { name: "Name" }).press("Tab");
  await page
    .getByRole("textbox", { name: "Email" })
    .fill(`lukasz${Math.floor(Math.random() * 10000)}@test.com`);
  await page.getByRole("textbox", { name: "Email" }).press("Tab");
  await page.getByRole("textbox", { name: "Password" }).fill("samplepassword");
  await page.getByRole("button", { exact: true, name: "Sign Up" }).click();
  await expect(page.getByRole("heading", { name: "My Resumes" })).toBeVisible();
});
