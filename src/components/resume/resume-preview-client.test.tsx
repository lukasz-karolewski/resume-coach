import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import ResumePreviewClient from "./resume-preview-client";

const mockResume = {
  contactInfo: null,
  education: [],
  experience: [],
  id: 7,
  name: "Platform Resume",
  summary: "Summary",
};

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockResumePdfViewer({ resume }: { resume: typeof mockResume }) {
      return <div data-testid="pdf-viewer">{resume.name}</div>;
    },
}));

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({ data: mockResume }),
}));

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    resume: {
      getById: {
        queryOptions: (input: unknown) => ({ input, queryKey: ["detail"] }),
      },
    },
  }),
}));

describe("ResumePreviewClient", () => {
  test("renders a route back to the editor and the PDF preview", () => {
    render(<ResumePreviewClient resumeId={7} />);

    expect(
      screen.getByRole("link", { name: "Back to editor" }),
    ).toHaveAttribute("href", "/resume/7");
    expect(
      screen.getByRole("heading", { name: "Platform Resume" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("pdf-viewer")).toHaveTextContent(
      "Platform Resume",
    );
  });
});
