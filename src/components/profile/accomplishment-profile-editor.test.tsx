import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  type AccomplishmentProfileDraft,
  AccomplishmentProfileEditor,
} from "./accomplishment-profile-editor";

const mockUseMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    profile: {
      pathFilter: () => ({ queryKey: ["profile"] }),
      saveAccomplishmentProfile: {
        mutationOptions: (options: unknown) => options,
      },
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => mockUseMutation(options),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
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

  test("saves a sanitized payload and invalidates profile data", async () => {
    let capturedOptions:
      | {
          onSettled?: () => Promise<void>;
        }
      | undefined;

    const mutate = vi.fn(() => {
      void capturedOptions?.onSettled?.();
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
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["profile"],
      });
    });
  });
});
