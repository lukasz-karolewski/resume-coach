import { describe, expect, test } from "vitest";
import Image, { contentType, size } from "./opengraph-image";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

describe("share image", () => {
  test("renders a PNG for link previews", async () => {
    const response = await Image();
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(contentType).toBe("image/png");
    expect(size).toEqual({ height: 630, width: 1200 });
    expect([...bytes.slice(0, 4)]).toEqual(PNG_SIGNATURE);
  });
});
