import "server-only";

import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";
import { Readable } from "node:stream";
import { isPublicRoutableHost } from "@better-auth/core/utils/host";

/**
 * Node CIMD transport that preserves every validated DNS answer.
 *
 * The upstream 1.7.5 transport pins only the first answer. IPv6-first hosts
 * then fail on runtimes with IPv4-only egress, including Vercel. This transport
 * keeps the upstream SSRF protections while allowing Node to fall back from
 * IPv6 to IPv4. Remove it once @better-auth/cimd replays every validated
 * address. See https://github.com/lukasz-karolewski/savvysaver/issues/194.
 */

type DnsAnswer = { address: string; family: number };

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  addressOrAddresses: DnsAnswer[] | string,
  family?: number,
) => void;

/** Replays validated answers without another DNS lookup. */
export function pinnedLookup(addresses: DnsAnswer[]) {
  return (
    _hostname: string,
    options: { all?: boolean },
    callback: LookupCallback,
  ) => {
    if (options?.all) {
      callback(
        null,
        addresses.map((entry) => ({
          address: entry.address,
          family: entry.family,
        })),
      );
      return;
    }
    callback(null, addresses[0].address, addresses[0].family);
  };
}

const BODY_FORBIDDEN_RESPONSE_STATUSES = new Set([204, 205, 304]);

function responseHeaders(headers: NodeJS.Dict<string | string[]>) {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      for (const item of value) result.append(name, item);
    } else if (value !== undefined) {
      result.append(name, value);
    }
  }
  return result;
}

export const fetchClientMetadataResource = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const webRequest = new Request(input, init);
  const url = new URL(webRequest.url);

  if (url.protocol !== "https:") {
    throw new TypeError("CIMD Node transport requires an HTTPS URL");
  }
  if (webRequest.method !== "GET" && webRequest.method !== "HEAD") {
    throw new TypeError("CIMD Node transport supports only GET and HEAD");
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new TypeError("metadata hostname returned no DNS addresses");
  }
  for (const result of addresses) {
    if (!isPublicRoutableHost(result.address)) {
      throw new TypeError(
        "metadata hostname must resolve only to public-routable addresses",
      );
    }
  }

  const headers = Object.fromEntries(webRequest.headers.entries());
  headers.host = url.host;
  const signal =
    init?.signal ??
    (input instanceof Request ? input.signal : webRequest.signal);

  return new Promise((resolve, reject) => {
    const outbound = request(
      url,
      {
        agent: false,
        headers,
        lookup: pinnedLookup(addresses),
        method: webRequest.method,
        servername:
          isIP(url.hostname.replace(/^\[|\]$/g, "")) === 0
            ? url.hostname
            : undefined,
        signal,
      },
      (response) => {
        const status = response.statusCode ?? 500;
        const body =
          webRequest.method === "HEAD" ||
          BODY_FORBIDDEN_RESPONSE_STATUSES.has(status)
            ? null
            : (Readable.toWeb(response) as ReadableStream);
        resolve(
          new Response(body, {
            headers: responseHeaders(response.headers),
            status,
            statusText: response.statusMessage,
          }),
        );
      },
    );
    outbound.once("error", reject);
    outbound.end();
  });
};
