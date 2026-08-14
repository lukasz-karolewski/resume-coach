import withBundleAnalyzerBuilder from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import "./src/env.js";

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "*.googleusercontent.com",
        pathname: "**",
        port: "",
        protocol: "https",
      },
    ],
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

const withBundleAnalyzer = withBundleAnalyzerBuilder({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(config);
