"use client";

import {
  type AuthenticationResponseJSON,
  browserSupportsWebAuthnAutofill,
  type PublicKeyCredentialRequestOptionsJSON,
  startAuthentication,
  WebAuthnAbortService,
  WebAuthnError,
} from "@simplewebauthn/browser";
import { useCallback, useEffect, useEffectEvent, useRef } from "react";

import { authClient } from "~/auth-client";

/** Better Auth keeps the passkey challenge for 5 minutes; refresh before then. */
export const AUTOFILL_REFRESH_MS = 4 * 60 * 1000;

type Attempt = {
  active: boolean;
  /** Settles once this attempt's options request (and challenge cookie) lands. */
  optionsRequest: Promise<void>;
  refreshTimer?: ReturnType<typeof setTimeout>;
};

function isPromptCancelled(error: unknown) {
  return (
    error instanceof WebAuthnError &&
    error.cause instanceof Error &&
    error.cause.name === "NotAllowedError"
  );
}

/**
 * Keeps a conditional-mediation passkey request pending so the browser can
 * offer saved passkeys in the username field's autofill. It never opens a
 * modal prompt and stays silent when unsupported. It re-arms after the person
 * dismisses a passkey, after a failed sign-in, and before the challenge
 * expires, and only one request is ever pending.
 *
 * The flow mirrors Better Auth's `signIn.passkey({ autoFill: true })`, split
 * into steps so a stopped attempt can bail between them.
 *
 * Await `stop()` before any explicit `signIn.passkey()` call: it also waits for
 * an in-flight options request, whose challenge cookie would otherwise replace
 * the explicit request's. Call `start()` afterwards if the person stays.
 */
export function usePasskeyAutofill({
  onError,
  onSignedIn,
}: {
  onError: () => void;
  onSignedIn: () => void;
}) {
  const current = useRef<Attempt | null>(null);
  const signedIn = useEffectEvent(onSignedIn);
  const failed = useEffectEvent(onError);

  const stop = useCallback(() => {
    const attempt = current.current;
    if (!attempt) return Promise.resolve();

    current.current = null;
    attempt.active = false;
    clearTimeout(attempt.refreshTimer);
    WebAuthnAbortService.cancelCeremony();
    return attempt.optionsRequest;
  }, []);

  const start = useCallback(() => {
    const previous = stop();
    const attempt: Attempt = { active: true, optionsRequest: previous };
    current.current = attempt;

    void (async () => {
      try {
        await previous;
        if (!attempt.active || !(await browserSupportsWebAuthnAutofill())) {
          return;
        }
        if (!attempt.active) return;

        const options =
          authClient.$fetch<PublicKeyCredentialRequestOptionsJSON>(
            "/passkey/generate-authenticate-options",
            { method: "GET", throw: false },
          );
        attempt.optionsRequest = options.then(
          () => undefined,
          () => undefined,
        );
        const { data: optionsJSON } = await options;
        if (!attempt.active || !optionsJSON) return;

        attempt.refreshTimer = setTimeout(start, AUTOFILL_REFRESH_MS);

        let credential: AuthenticationResponseJSON;
        try {
          credential = await startAuthentication({
            optionsJSON,
            useBrowserAutofill: true,
          });
        } catch (error) {
          if (attempt.active && isPromptCancelled(error)) start();
          return;
        }
        if (!attempt.active) return;
        clearTimeout(attempt.refreshTimer);

        const { clientExtensionResults: _, ...response } = credential;
        const verified = await authClient.$fetch<{ session: unknown }>(
          "/passkey/verify-authentication",
          { body: { response }, method: "POST", throw: false },
        );
        if (!attempt.active) return;

        if (verified.data) {
          signedIn();
        } else {
          failed();
          start();
        }
      } catch {
        // Autofill is an optional shortcut; the form still works without it.
      }
    })();
  }, [stop]);

  useEffect(() => {
    start();
    return () => void stop();
  }, [start, stop]);

  return { start, stop };
}
