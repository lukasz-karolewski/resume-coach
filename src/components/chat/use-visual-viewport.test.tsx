import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { useVisualViewport } from "./use-visual-viewport";

function Panel() {
  const ref = useRef<HTMLDivElement>(null);
  useVisualViewport(ref);
  return <div data-testid="panel" ref={ref} />;
}

function stubVisualViewport(height: number, offsetTop: number) {
  const visualViewport = Object.assign(new EventTarget(), {
    height,
    offsetTop,
  });
  vi.stubGlobal("visualViewport", visualViewport);
  return visualViewport;
}

describe("useVisualViewport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("tracks the visual viewport as the keyboard opens", () => {
    const visualViewport = stubVisualViewport(800, 0);

    render(<Panel />);
    const panel = screen.getByTestId("panel");

    expect(panel.style.getPropertyValue("--visual-viewport-height")).toBe(
      "800px",
    );

    act(() => {
      visualViewport.height = 450;
      visualViewport.offsetTop = 120;
      visualViewport.dispatchEvent(new Event("resize"));
    });

    expect(panel.style.getPropertyValue("--visual-viewport-height")).toBe(
      "450px",
    );
    expect(panel.style.getPropertyValue("--visual-viewport-top")).toBe("120px");
  });

  test("leaves the CSS fallbacks in place without the API", () => {
    vi.stubGlobal("visualViewport", undefined);

    render(<Panel />);

    expect(
      screen
        .getByTestId("panel")
        .style.getPropertyValue("--visual-viewport-height"),
    ).toBe("");
  });
});
