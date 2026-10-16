import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { signIn } from "~/auth-client";

import {
  isPasskeyCeremonyAborted,
  usePasskeyAutofill,
} from "./use-passkey-autofill";

const { browserSupportsWebAuthnAutofill, cancelCeremony } = vi.hoisted(() => ({
  browserSupportsWebAuthnAutofill: vi.fn(),
  cancelCeremony: vi.fn(),
}));

vi.mock("@simplewebauthn/browser", () => ({
  browserSupportsWebAuthnAutofill,
  WebAuthnAbortService: { cancelCeremony },
}));
vi.mock("~/auth-client", () => ({ signIn: { passkey: vi.fn() } }));

const passkeySignIn = vi.mocked(signIn.passkey);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("usePasskeyAutofill", () => {
  beforeEach(() => {
    browserSupportsWebAuthnAutofill.mockReset().mockResolvedValue(true);
    passkeySignIn.mockReset();
  });

  test("does not request a passkey where conditional mediation is unsupported", async () => {
    browserSupportsWebAuthnAutofill.mockResolvedValue(false);

    renderHook(() => usePasskeyAutofill(vi.fn()));

    await waitFor(() =>
      expect(browserSupportsWebAuthnAutofill).toHaveBeenCalled(),
    );
    expect(passkeySignIn).not.toHaveBeenCalled();
  });

  test("signs in when a passkey is picked from autofill", async () => {
    passkeySignIn.mockResolvedValue({
      data: { session: {} },
      error: null,
    } as never);
    const onSignedIn = vi.fn();

    renderHook(() => usePasskeyAutofill(onSignedIn));

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledTimes(1));
    expect(passkeySignIn).toHaveBeenCalledWith({ autoFill: true });
  });

  test("stays silent when the autofill request fails", async () => {
    passkeySignIn.mockResolvedValue({
      data: null,
      error: { code: "AUTH_CANCELLED", status: 400, statusText: "" },
    });
    const onSignedIn = vi.fn();

    renderHook(() => usePasskeyAutofill(onSignedIn));

    await waitFor(() => expect(passkeySignIn).toHaveBeenCalled());
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  test("cancels the pending request and ignores its result after unmount", async () => {
    const pending = deferred<Awaited<ReturnType<typeof signIn.passkey>>>();
    passkeySignIn.mockReturnValue(pending.promise);
    const onSignedIn = vi.fn();

    const { unmount } = renderHook(() => usePasskeyAutofill(onSignedIn));
    await waitFor(() => expect(passkeySignIn).toHaveBeenCalled());
    unmount();
    pending.resolve({ data: { session: {} }, error: null } as never);
    await pending.promise;

    expect(cancelCeremony).toHaveBeenCalled();
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  test("re-arms autofill after an explicit passkey attempt", async () => {
    passkeySignIn.mockResolvedValue({ data: null, error: null } as never);

    const { result } = renderHook(() => usePasskeyAutofill(vi.fn()));
    await waitFor(() => expect(passkeySignIn).toHaveBeenCalledTimes(1));
    result.current.restart();

    await waitFor(() => expect(passkeySignIn).toHaveBeenCalledTimes(2));
    expect(cancelCeremony).toHaveBeenCalledTimes(1);
  });
});

test("treats only programmatic aborts as silent", () => {
  expect(isPasskeyCeremonyAborted({ code: "ERROR_CEREMONY_ABORTED" })).toBe(
    true,
  );
  expect(isPasskeyCeremonyAborted({ code: "AUTH_CANCELLED" })).toBe(false);
  expect(isPasskeyCeremonyAborted(null)).toBe(false);
});
