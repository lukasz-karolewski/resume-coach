import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ConnectedAppsCard } from "./connected-apps-card";

const { disconnect, invalidateQueries, mutationOptions, toastAdd } = vi.hoisted(
  () => ({
    disconnect: vi.fn(),
    invalidateQueries: vi.fn(),
    mutationOptions: {
      current: undefined as Record<string, unknown> | undefined,
    },
    toastAdd: vi.fn(),
  }),
);

const mockTrpc = {
  profile: {
    disconnectConnectedApp: {
      mutationOptions: (options: Record<string, unknown>) => {
        mutationOptions.current = options;
        return options;
      },
    },
    getConnectedApps: {
      queryOptions: () => ({ queryKey: ["profile", "connected-apps"] }),
    },
    pathFilter: () => ({ queryKey: ["profile"] }),
  },
};

vi.mock("~/trpc/react", () => ({ useTRPC: () => mockTrpc }));
vi.mock("~/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));
vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: Record<string, unknown>) => {
    mutationOptions.current = options;
    return { isPending: false, mutate: disconnect };
  },
  useQueryClient: () => ({ invalidateQueries }),
  useSuspenseQuery: () => ({
    data: [
      {
        clientId: "chatgpt-client",
        connectedAt: new Date("2026-09-20T18:00:00.000Z"),
        id: "consent-1",
        isActive: true,
        name: "ChatGPT",
        permissions: ["Use Resume Coach tools on your behalf"],
        uri: "https://chatgpt.com",
      },
    ],
  }),
}));

describe("ConnectedAppsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutationOptions.current = undefined;
  });

  test("shows grants and disconnects the selected client", () => {
    render(<ConnectedAppsCard />);

    expect(
      screen.getByRole("heading", { name: "Connected apps" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "ChatGPT" })).toHaveAttribute(
      "href",
      "https://chatgpt.com",
    );
    expect(
      screen.getByText("Use Resume Coach tools on your behalf"),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    fireEvent.click(screen.getByRole("button", { name: "Disconnect ChatGPT" }));

    expect(disconnect).toHaveBeenCalledWith({ clientId: "chatgpt-client" });
  });

  test("refreshes profile data after disconnecting", async () => {
    render(<ConnectedAppsCard />);

    await (
      mutationOptions.current?.onSuccess as (() => Promise<void>) | undefined
    )?.();

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(toastAdd).toHaveBeenCalledWith({
      title: "App disconnected",
      type: "success",
    });
  });
});
