import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PageLoading from "./page-loading";

describe("PageLoading", () => {
  test("renders the panel variant without loading text", () => {
    render(<PageLoading />);

    expect(screen.getByTestId("page-loading-panel")).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  test("renders the cards variant", () => {
    render(<PageLoading variant="cards" />);

    expect(screen.getByTestId("page-loading-cards")).toBeInTheDocument();
  });

  test("renders the document variant", () => {
    render(<PageLoading variant="document" />);

    expect(screen.getByTestId("page-loading-document")).toBeInTheDocument();
  });
});
