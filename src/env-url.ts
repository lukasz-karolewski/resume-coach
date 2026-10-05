export function getBetterAuthUrl(env: NodeJS.ProcessEnv): string | undefined {
  const configuredUrl = env.BETTER_AUTH_URL;
  if (configuredUrl) return configuredUrl;

  const vercelHost =
    env.VERCEL_ENV === "production"
      ? (env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL)
      : (env.VERCEL_URL ?? env.VERCEL_PROJECT_PRODUCTION_URL);
  return vercelHost ? `https://${vercelHost}` : undefined;
}
