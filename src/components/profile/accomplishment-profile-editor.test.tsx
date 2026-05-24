import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  type AccomplishmentProfileDraft,
  AccomplishmentProfileEditor,
} from "./accomplishment-profile-editor";

const mockRefresh = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("~/trpc/react", () => ({
  api: {
    profile: {
      saveAccomplishmentProfile: {
        useMutation: (options: unknown) => mockUseMutation(options),
      },
    },
  },
}));

describe("AccomplishmentProfileEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  test("renders the existing role and accomplishment entries", () => {
    const profile: AccomplishmentProfileDraft = {
      roles: [
        {
          companyName: "Example Corp",
          endMonth: "2024-06",
          entries: [{ content: "Led a platform migration.", id: "entry-1" }],
          id: "role-1",
          location: "Remote",
          startMonth: "2022-01",
          title: "Senior Engineer",
        },
      ],
    };

    render(<AccomplishmentProfileEditor initialProfile={profile} />);

    expect(screen.getByDisplayValue("Example Corp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Senior Engineer")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Led a platform migration."),
    ).toBeInTheDocument();
  });

  test("adds a new role block from the empty state", () => {
    render(
      <AccomplishmentProfileEditor
        initialProfile={{
          roles: [],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /add role/i }));

    expect(screen.getByLabelText("Company")).toBeInTheDocument();
    expect(screen.getByLabelText("Role title")).toBeInTheDocument();
  });

  test("saves a sanitized payload and refreshes after success", async () => {
    let capturedOptions:
      | {
          onSuccess?: () => void;
        }
      | undefined;

    const mutate = vi.fn(() => {
      capturedOptions?.onSuccess?.();
    });

    mockUseMutation.mockImplementation((options) => {
      capturedOptions = options as typeof capturedOptions;
      return {
        isPending: false,
        mutate,
      };
    });

    render(
      <AccomplishmentProfileEditor
        initialProfile={{
          roles: [
            {
              companyName: "Example Corp",
              endMonth: "",
              entries: [
                { content: "Shipped the first release.", id: "entry-1" },
                { content: "   ", id: "entry-2" },
              ],
              id: "role-1",
              location: "Remote",
              startMonth: "2023-01",
              title: "Staff Engineer",
            },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /save profile/i }));

    expect(mutate).toHaveBeenCalledWith({
      roles: [
        {
          companyName: "Example Corp",
          endMonth: undefined,
          entries: [{ content: "Shipped the first release." }],
          location: "Remote",
          startMonth: "2023-01",
          title: "Staff Engineer",
        },
      ],
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
