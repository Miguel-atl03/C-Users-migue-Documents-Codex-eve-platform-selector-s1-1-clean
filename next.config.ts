import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright and local QA use 127.0.0.1; Next binds as localhost by default.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
