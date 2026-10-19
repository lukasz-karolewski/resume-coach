import { expect, type Page, test } from "@playwright/test";

import { signUp } from "./helpers";

async function openNewResume(page: Page) {
  await page.goto("/resume");
  await page.getByRole("button", { name: "Create new resume" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox")
    .first()
    .fill("Editing Controls Resume");
  await page.getByRole("button", { name: "Create Resume" }).click();
  await page.locator("main a[href^='/resume/']").first().click();
  await expect(
    page.getByRole("textbox", { name: "Resume name" }),
  ).toBeVisible();
}

async function addPatent(page: Page, title: string) {
  // Named so it never matches a toast, which also has the dialog role.
  const dialog = page.getByRole("dialog", { name: "Add patent" });
  await dialog.getByLabel("Patent title").fill(title);
  await dialog.getByLabel("Date").fill("2021-06");
  await dialog.getByLabel("Description").fill("Reduced stale reads.");
  await dialog.getByRole("button", { name: "Add patent" }).click();
  await expect(dialog).toBeHidden();
}

test("resume items carry their own edit controls, hidden in print", async ({
  page,
}) => {
  // The first visit compiles each route under `next dev`.
  test.setTimeout(90_000);
  await signUp(page, "Resume Editor");
  await openNewResume(page);

  await page.getByRole("button", { name: "Resume actions" }).click();
  await page.getByRole("menuitem", { name: "Add section" }).click();
  await page.getByRole("menuitem", { name: "Patents" }).click();
  await addPatent(page, "Adaptive cache invalidation");

  // The dashed placeholder at the top of the section adds the next item.
  await page.getByRole("button", { name: "Add patent" }).click();
  await addPatent(page, "Predictive prefetching");

  const deleteFirst = page.getByRole("button", {
    name: "Delete patent Adaptive cache invalidation",
  });
  // Controls show without hovering, on desktop as on mobile.
  await expect(deleteFirst).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(
    page.getByText("Adaptive cache invalidation", { exact: true }),
  ).toBeVisible();
  await expect(deleteFirst).toBeHidden();
  await expect(page.getByRole("button", { name: "Add patent" })).toBeHidden();
  await page.emulateMedia({ media: "screen" });

  await deleteFirst.click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(
    page.getByText("Adaptive cache invalidation", { exact: true }),
  ).toBeHidden();
  await expect(
    page.getByText("Predictive prefetching", { exact: true }),
  ).toBeVisible();
});
