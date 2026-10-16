// Shared by the resume editor and its loading skeleton so the two stay in step
// across breakpoints. The sticky offset matches the top nav's height at `sm`+;
// below that the nav wraps to two rows, so the toolbar scrolls with the page.
export const resumeToolbarClass =
  "z-20 mx-auto w-full max-w-[calc(8.5in+6rem)] sm:sticky sm:top-[89px] print:hidden";
export const resumeToolbarInnerClass =
  "rounded-2xl border bg-card/95 px-4 py-3 shadow-sm backdrop-blur sm:px-12";
export const resumePaperClass =
  "mx-auto bg-white p-6 shadow-lg sm:p-12 print:p-0 print:shadow-none";
