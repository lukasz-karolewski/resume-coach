import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { authClient } from "~/auth-client";

import {
  AUTOFILL_REFRESH_MS,
  usePasskeyAutofill,
} from "./use-passkey-autofill";

const { browserSupportsWebAuthnAutofill, cancelCeremony, startAuthentication } =
  vi.hoisted(() => ({
    browserSupportsWebAuthnAutofill: vi.fn(),
    cancelCeremony: vi.fn(),
    startAuthentication: vi.fn(),
  }));

vi.mock("@simplewebauthn/browser", () => {
  class WebAuthnError extends Error {
    code: string;
    constructor({ cause, code }: { cause: Error; code: string }) {
      super(cause.message, { cause });
      this.code = code;
    }
  }
  return {
    browserSupportsWebAuthnAutofill,
    startAuthentication,
    WebAuthnAbortService: { cancelCeremony },
    WebAuthnError,
  };
});
vi.mock("~/auth-client", () => ({ authClient: { $fetch: vi.fn() } }));

const $fetch = vi.mocked(authClient.$fetch);

const OPTIONS = { challenge: "challenge" };
const CREDENTIAL = { clientExtensionResults: {}, id: "credential" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function optionsCalls() {
  return $fetch.mock.calls.filter(([path]) =>
    String(path).includes("generate-authenticate-options"),
  ).length;
}

async function cancelledPrompt() {
  const { WebAuthnError } = await import("@simplewebauthn/browser");
  const cause = new Error("cancelled");
  cause.name = "NotAllowedError";
  return new WebAuthnError({
    cause,
    code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
  } as never);
}

function renderAutofill() {
  const callbacks = { onError: vi.fn(), onSignedIn: vi.fn() };
  const hook = renderHook(() => usePasskeyAutofill(callbacks));
  return { ...callbacks, ...hook };
}

describe("usePasskeyAutofill", () => {
  beforeEach(() => {
    browserSupportsWebAuthnAutofill.mockReset().mockResolvedValue(true);
    cancelCeremony.mockReset();
    startAuthentication.mockReset().mockReturnValue(new Promise(() => {}));
    $fetch
      .mockReset()
      .mockImplementation(async (path) =>
        String(path).includes("generate-authenticate-options")
          ? { data: OPTIONS, error: null }
          : { data: { session: {} }, error: null },
      );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("does not request a passkey where conditional mediation is unsupported", async () => {
    browserSupportsWebAuthnAutofill.mockResolvedValue(false);

    renderAutofill();

    await waitFor(() =>
      expect(browserSupportsWebAuthnAutofill).toHaveBeenCalled(),
    );
    expect($fetch).not.toHaveBeenCalled();
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  test("signs in when a passkey is picked from autofill", async () => {
    startAuthentication.mockResolvedValue(CREDENTIAL);

    const { onError, onSignedIn } = renderAutofill();

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledTimes(1));
    expect(startAuthentication).toHaveBeenCalledWith({
      optionsJSON: OPTIONS,
      useBrowserAutofill: true,
    });
    expect($fetch).toHaveBeenCalledWith(
      "/passkey/verify-authentication",
      expect.objectContaining({ body: { response: { id: "credential" } } }),
    );
    expect(onError).not.toHaveBeenCalled();
  });

  test("re-arms silently after the person dismisses the passkey prompt", async () => {
    startAuthentication
      .mockRejectedValueOnce(await cancelledPrompt())
      .mockReturnValue(new Promise(() => {}));

    const { onError, onSignedIn } = renderAutofill();

    await waitFor(() => expect(startAuthentication).toHaveBeenCalledTimes(2));
    expect(onError).not.toHaveBeenCalled();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  test("does not retry a prompt that fails for another reason", async () => {
    startAuthentication.mockRejectedValue(new Error("no webauthn input"));

    const { onError } = renderAutofill();

    await waitFor(() => expect(startAuthentication).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(startAuthentication).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  test("reports a rejected passkey and re-arms autofill", async () => {
    startAuthentication
      .mockResolvedValueOnce(CREDENTIAL)
      .mockReturnValue(new Promise(() => {}));
    $fetch.mockImplementation(async (path) =>
      String(path).includes("generate-authenticate-options")
        ? { data: OPTIONS, error: null }
        : { data: null, error: { code: "PASSKEY_NOT_FOUND" } },
    );

    const { onError, onSignedIn } = renderAutofill();

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(startAuthentication).toHaveBeenCalledTimes(2));
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  test("refreshes the request before its challenge expires", async () => {
    vi.useFakeTimers();

    renderAutofill();
    await vi.waitFor(() =>
      expect(startAuthentication).toHaveBeenCalledTimes(1),
    );
    await act(() => vi.advanceTimersByTimeAsync(AUTOFILL_REFRESH_MS));

    await vi.waitFor(() => expect(optionsCalls()).toBe(2));
    expect(cancelCeremony).toHaveBeenCalled();
  });

  test("stays silent when the network fails", async () => {
    $fetch.mockRejectedValue(new Error("offline"));

    const { onError, onSignedIn } = renderAutofill();

    await waitFor(() => expect($fetch).toHaveBeenCalled());
    expect(onError).not.toHaveBeenCalled();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  test("never starts a prompt after unmount", async () => {
    const options = deferred<{ data: typeof OPTIONS; error: null }>();
    $fetch.mockReturnValue(options.promise as never);

    const { unmount } = renderAutofill();
    await waitFor(() => expect($fetch).toHaveBeenCalled());
    unmount();
    await act(async () => options.resolve({ data: OPTIONS, error: null }));

    expect(cancelCeremony).toHaveBeenCalled();
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  test("stop waits for an in-flight options request and keeps it from prompting", async () => {
    const options = deferred<{ data: typeof OPTIONS; error: null }>();
    $fetch.mockReturnValue(options.promise as never);

    const { result } = renderAutofill();
    await waitFor(() => expect($fetch).toHaveBeenCalled());

    let stopped = false;
    const stopping = result.current.stop().then(() => {
      stopped = true;
    });
    await act(async () => {});
    expect(stopped).toBe(false);

    await act(async () => {
      options.resolve({ data: OPTIONS, error: null });
      await stopping;
    });
    expect(stopped).toBe(true);
    expect(startAuthentication).not.toHaveBeenCalled();
  });

  test("start re-arms autofill after it was stopped", async () => {
    const { result } = renderAutofill();
    await waitFor(() => expect(startAuthentication).toHaveBeenCalledTimes(1));

    await act(() => result.current.stop());
    act(() => result.current.start());

    await waitFor(() => expect(startAuthentication).toHaveBeenCalledTimes(2));
  });
});
