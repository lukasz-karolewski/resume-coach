import { type RefObject, useEffect } from "react";

/**
 * Pins an element to the visual viewport by publishing its size as CSS
 * variables. When the on-screen keyboard opens, iOS Safari shrinks only the
 * visual viewport (and may scroll it), so a `100dvh` panel ends up with its
 * bottom, and the chat input, hidden behind the keyboard.
 */
export function useVisualViewport(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    const visualViewport = window.visualViewport;
    if (!element || !visualViewport) {
      return;
    }

    const update = () => {
      element.style.setProperty(
        "--visual-viewport-height",
        `${visualViewport.height}px`,
      );
      element.style.setProperty(
        "--visual-viewport-top",
        `${visualViewport.offsetTop}px`,
      );
    };

    update();
    visualViewport.addEventListener("resize", update);
    visualViewport.addEventListener("scroll", update);

    return () => {
      visualViewport.removeEventListener("resize", update);
      visualViewport.removeEventListener("scroll", update);
    };
  }, [ref]);
}
