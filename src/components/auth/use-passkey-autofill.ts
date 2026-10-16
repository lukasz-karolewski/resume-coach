"use client";

import {
  browserSupportsWebAuthnAutofill,
  WebAuthnAbortService,
} from "@simplewebauthn/browser";
import { useCallback, useEffect, useRef, useState } from "react";

import { signIn } from "~/auth-client";

/** Programmatic aborts (unmount, a newer ceremony) are not user-facing failures. */
export function isPasskeyCeremonyAborted(error: object | null) {
  return !!error && "code" in error && error.code === "ERROR_CEREMONY_ABORTED";
}

/**
 * Starts a conditional-mediation passkey request so the browser can offer
 * saved passkeys in the username field's autofill. It never opens a modal
 * prompt, stays silent when unsupported or when nothing is picked, and aborts
 * on unmount so only one request is pending at a time.
 *
 * Any explicit `signIn.passkey()` call aborts this request; call `restart`
 * afterwards when the person stays on the page.
 */
export function usePasskeyAutofill(onSignedIn: () => void) {
  const [attempt, setAttempt] = useState(0);
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  useEffect(() => {
    // `attempt` only re-arms the request after an explicit passkey attempt.
    void attempt;
    let active = true;

    void (async () => {
      if (!(await browserSupportsWebAuthnAutofill()) || !active) return;

      const { data } = await signIn.passkey({ autoFill: true });
      if (active && data) onSignedInRef.current();
    })();

    return () => {
      active = false;
      WebAuthnAbortService.cancelCeremony();
    };
  }, [attempt]);

  return {
    restart: useCallback(() => setAttempt((value) => value + 1), []),
  };
}
