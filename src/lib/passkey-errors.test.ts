import { expect, test } from "vitest";

import { isPasskeyPromptDismissed } from "./passkey-errors";

test("treats cancelled and aborted prompts as dismissed", () => {
  expect(isPasskeyPromptDismissed({ code: "ERROR_CEREMONY_ABORTED" })).toBe(
    true,
  );
  expect(
    isPasskeyPromptDismissed({ code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY" }),
  ).toBe(true);
});

test("treats server and unknown failures as real errors", () => {
  expect(isPasskeyPromptDismissed({ code: "PASSKEY_NOT_FOUND" })).toBe(false);
  expect(isPasskeyPromptDismissed({ status: 500 })).toBe(false);
  expect(isPasskeyPromptDismissed(null)).toBe(false);
});
