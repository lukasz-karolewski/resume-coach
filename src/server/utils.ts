"server-only";

import { TRPCError } from "@trpc/server";

/**
 * Wraps a function call with error handling to provide consistent error messages
 * @param fn The function to execute
 * @param errorMessage The error message to show if the function fails
 * @returns The result of the function
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);

    // If it's already a TRPCError, rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }

    // Otherwise, wrap it in a generic INTERNAL_SERVER_ERROR
    throw new TRPCError({
      cause: error,
      code: "INTERNAL_SERVER_ERROR",
      message: errorMessage,
    });
  }
}
