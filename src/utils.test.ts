import { describe, expect, test } from "vitest";

import { zodErrorsToString } from "./utils";

describe("zodErrorsToString", () => {
  test("combines field and form errors", () => {
    expect(
      zodErrorsToString({
        data: {
          zodError: {
            fieldErrors: {
              email: ["Enter a valid email"],
              name: ["Name is required", "Name is too short"],
            },
            formErrors: ["Review the form"],
          },
        },
      }),
    ).toBe(
      "Enter a valid email, Name is required, Name is too short, Review the form",
    );
  });

  test("returns an empty string for an unknown error shape", () => {
    expect(zodErrorsToString(new Error("Request failed"))).toBe("");
    expect(zodErrorsToString(null)).toBe("");
  });
});
