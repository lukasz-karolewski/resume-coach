/**
 * Errors from a passkey prompt that need no message: our own aborts (unmount,
 * a newer request) and the browser's NotAllowedError, which it raises when the
 * person cancels the prompt. Better Auth reports NotAllowedError as the
 * SimpleWebAuthn passthrough code and drops its cause, so match the code.
 */
const DISMISSED_CODES = new Set([
  "ERROR_CEREMONY_ABORTED",
  "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
]);

export function isPasskeyPromptDismissed(error: object | null) {
  return (
    !!error &&
    "code" in error &&
    typeof error.code === "string" &&
    DISMISSED_CODES.has(error.code)
  );
}
