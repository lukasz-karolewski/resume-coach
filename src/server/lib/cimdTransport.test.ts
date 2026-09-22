import { describe, expect, test } from "vitest";
import { pinnedLookup } from "./cimdTransport";

type DnsAnswer = { address: string; family: number };

const addresses: DnsAnswer[] = [
  { address: "2606:4700:4408::ac40:9bd1", family: 6 },
  { address: "172.64.155.209", family: 4 },
];

function resolveAll(answers: DnsAnswer[], hostname = "chatgpt.com") {
  return new Promise<DnsAnswer[]>((resolve, reject) => {
    pinnedLookup(answers)(hostname, { all: true }, (error, value) => {
      if (error) reject(error);
      else if (typeof value === "string")
        reject(new Error("all:true lookup answered with a bare string"));
      else resolve(value);
    });
  });
}

describe("pinnedLookup", () => {
  test("answers an all:true lookup with an array", async () => {
    await expect(resolveAll(addresses)).resolves.toEqual(addresses);
  });

  test("keeps every answer so a v6-first host can fall back to v4", async () => {
    const result = await resolveAll(addresses);

    expect(result.map((entry) => entry.family)).toEqual([6, 4]);
  });

  test("answers a single-address lookup with the first answer", async () => {
    const lookup = pinnedLookup(addresses);
    const result = await new Promise((resolve, reject) => {
      lookup("chatgpt.com", {}, (error, address, family) =>
        error ? reject(error) : resolve({ address, family }),
      );
    });

    expect(result).toEqual({
      address: "2606:4700:4408::ac40:9bd1",
      family: 6,
    });
  });

  test("replays validated addresses without resolving the supplied hostname", async () => {
    await expect(
      resolveAll([{ address: "8.8.8.8", family: 4 }], "attacker.example"),
    ).resolves.toEqual([{ address: "8.8.8.8", family: 4 }]);
  });
});
