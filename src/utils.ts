import type { ReadonlyURLSearchParams } from "next/navigation";
import { z } from "zod";

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams,
) => {
  const paramsString = params.toString();
  const queryString = `${paramsString.length ? "?" : ""}${paramsString}`;

  return `${pathname}${queryString}`;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function zodErrorsToString(error: unknown) {
  if (!isRecord(error) || !isRecord(error.data)) {
    return "";
  }

  const { zodError } = error.data;

  if (!isRecord(zodError)) {
    return "";
  }

  const fieldErrors = isRecord(zodError.fieldErrors)
    ? Object.values(zodError.fieldErrors).flatMap(getStringArray)
    : [];
  const formErrors = getStringArray(zodError.formErrors);

  return [...fieldErrors, ...formErrors].join(", ");
}

const emptyStringToNull = z.literal("").transform(() => null);

export function emptyToNull<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullable().or(emptyStringToNull);
}

export function normalizeWhitespace(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}
