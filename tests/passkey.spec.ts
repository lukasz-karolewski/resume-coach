import { expect, test } from "@playwright/test";

import { signUp, TEST_PASSWORD } from "./helpers";

test("visitors without a passkey get no prompt and can sign in with a password", async ({
  context,
  page,
}) => {
  const email = await signUp(page, "Password Tester");
  await context.clearCookies();
  const dialogs: string[] = [];
  page.on("dialog", (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("button", { name: "Sign in with passkey" }),
  ).toBeVisible();
  await expect(page.getByText("Sign in failed")).toBeHidden();

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { exact: true, name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/jobs$/, { timeout: 30_000 });
  expect(dialogs).toEqual([]);
});

test("a registered passkey signs in through autofill and the passkey button", async ({
  browserName,
  context,
  page,
}) => {
  test.skip(
    browserName !== "chromium",
    "Virtual authenticators are only available over Chromium's DevTools protocol",
  );

  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        automaticPresenceSimulation: true,
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        protocol: "ctap2",
        transport: "internal",
      },
    },
  );

  await signUp(page, "Passkey Tester");
  await page.goto("/profile");
  await page.getByRole("button", { name: "Add a passkey" }).click();
  await expect(page.getByRole("button", { name: "Remove" })).toBeVisible({
    timeout: 15_000,
  });

  // The virtual authenticator answers the page-load conditional request on
  // its own, standing in for a person picking the passkey from autofill.
  await context.clearCookies();
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).focus();
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 30_000 });

  // With presence simulation off the page-load conditional request stays
  // pending, so only the button's own request can finish once it is back on.
  await cdp.send("WebAuthn.setAutomaticPresenceSimulation", {
    authenticatorId,
    enabled: false,
  });
  await context.clearCookies();
  await page.goto("/login", { waitUntil: "networkidle" });
  const buttonRequest = page.waitForRequest(
    /\/api\/auth\/passkey\/generate-authenticate-options/,
  );
  await page.getByRole("button", { name: "Sign in with passkey" }).click();
  await buttonRequest;
  await cdp.send("WebAuthn.setAutomaticPresenceSimulation", {
    authenticatorId,
    enabled: true,
  });
  await expect(page).toHaveURL(/\/jobs$/, { timeout: 30_000 });
});
