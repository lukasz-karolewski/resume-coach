export type CachedClient<Client> = {
  client: Client;
  clientConstructor: unknown;
};

export function getOrCreateCachedClient<Client>(
  cache: CachedClient<Client> | undefined,
  clientConstructor: unknown,
  createClient: () => Client,
): CachedClient<Client> {
  if (cache && cache.clientConstructor === clientConstructor) {
    return cache;
  }

  return {
    client: createClient(),
    clientConstructor,
  };
}
