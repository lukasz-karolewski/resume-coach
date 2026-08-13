"use client";

import { useState } from "react";
import { authClient } from "~/auth-client";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";

export function ConsentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitDecision = async (accept: boolean) => {
    setIsSubmitting(true);
    setError("");

    const result = await authClient.oauth2.consent({ accept });

    if (result.error) {
      setError(result.error.message ?? "Unable to complete authorization.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => submitDecision(false)}
          variant="outline"
        >
          Deny
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => submitDecision(true)}
        >
          {isSubmitting ? "Authorizing..." : "Allow"}
        </Button>
      </div>
    </div>
  );
}
