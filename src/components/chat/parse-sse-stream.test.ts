import { describe, expect, test } from "vitest";
import { parseSseStream } from "./parse-sse-stream";
import { createByteStream } from "./tests/byte-stream";

describe("parseSseStream", () => {
  test("parses events split across arbitrary network chunks", async () => {
    const events = [];

    for await (const event of parseSseStream(
      createByteStream([
        'event: chunk\ndata: {"content":"Hel',
        'lo"}\n\nevent: done\r\ndata: {"threadId":"thread-1"}\r\n\r\n',
      ]),
    )) {
      events.push(event);
    }

    expect(events).toEqual([
      { data: { content: "Hello" }, type: "chunk" },
      { data: { threadId: "thread-1" }, type: "done" },
    ]);
  });
});
