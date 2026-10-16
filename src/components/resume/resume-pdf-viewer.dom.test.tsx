import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { ResumePdfData } from "./resume-pdf-viewer";
import ResumePdfViewer from "./resume-pdf-viewer";

const PAGE_COUNT = 3;

vi.mock("@react-pdf/renderer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@react-pdf/renderer")>()),
  PDFViewer: () => <iframe title="Embedded PDF" />,
  usePDF: () => [
    { blob: null, error: null, loading: false, url: "blob:resume-pdf" },
    vi.fn(),
  ],
}));

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    destroy: vi.fn(),
    promise: Promise.resolve({
      getPage: vi.fn(),
      numPages: PAGE_COUNT,
    }),
  }),
}));

const resume = {
  contactInfo: null,
  education: [],
  experience: [],
  id: 1,
  name: "Long Resume",
  patents: [],
  skills: [],
  summary: null,
} as unknown as ResumePdfData;

function setDevice({
  coarsePointer,
  pdfViewerEnabled,
}: {
  coarsePointer: boolean;
  pdfViewerEnabled: boolean;
}) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        addEventListener: vi.fn(),
        matches: query === "(pointer: coarse)" && coarsePointer,
        media: query,
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
  Object.defineProperty(navigator, "pdfViewerEnabled", {
    configurable: true,
    value: pdfViewerEnabled,
  });
}

describe("ResumePdfViewer", () => {
  beforeEach(() => {
    setDevice({ coarsePointer: false, pdfViewerEnabled: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("on a phone, shows every page of the resume instead of an embedded PDF", async () => {
    setDevice({ coarsePointer: true, pdfViewerEnabled: true });

    render(<ResumePdfViewer resume={resume} />);

    expect(await screen.findAllByRole("img")).toHaveLength(PAGE_COUNT);
    expect(screen.queryByTitle("Embedded PDF")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open pdf/i })).toHaveAttribute(
      "href",
      "blob:resume-pdf",
    );
  });

  test("shows every page when the browser cannot display PDFs inline", async () => {
    setDevice({ coarsePointer: false, pdfViewerEnabled: false });

    render(<ResumePdfViewer resume={resume} />);

    expect(await screen.findAllByRole("img")).toHaveLength(PAGE_COUNT);
  });

  test("on desktop, keeps the browser's own PDF viewer for printing", () => {
    render(<ResumePdfViewer resume={resume} />);

    expect(screen.getByTitle("Embedded PDF")).toBeInTheDocument();
  });
});
