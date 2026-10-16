import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { AuthScreen } from "./auth-screen";

describe("AuthScreen", () => {
  test.each(["focused", "split"] as const)(
    "%s layout brands the screen with the logo linking home",
    (layout) => {
      render(
        <AuthScreen layout={layout} title="Sign in" description="Welcome back">
          <p>Form</p>
        </AuthScreen>,
      );

      const home = screen.getByRole("link", { name: "Resume Coach" });
      expect(home).toHaveAttribute("href", "/");
      expect(screen.getByText("Resume Coach")).not.toHaveClass("sr-only");
    },
  );
});
