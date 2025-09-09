/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

import withBundleAnalyzerBuilder from "@next/bundle-analyzer";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
};

const withBundleAnalyzer = withBundleAnalyzerBuilder({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(config);
