import { describe, expect, test } from "vitest";
import { parseViewResumeCommand } from "./use-chat-stream";

describe("parseViewResumeCommand", () => {
  test("returns the resume id for a valid navigation command", () => {
    expect(parseViewResumeCommand("view resume 42")).toBe(42);
  });

  test("supports negative template resume ids", () => {
    expect(parseViewResumeCommand("view resume -1")).toBe(-1);
  });

  test("rejects assistant prose around the command", () => {
    expect(parseViewResumeCommand("Here you go: view resume 42")).toBeNull();
    expect(parseViewResumeCommand("view resume 42\nDone")).toBeNull();
  });
});
