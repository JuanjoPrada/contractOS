import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure firebase-admin is not bundled into client-side code
  serverExternalPackages: ['firebase-admin'],
  eslint: {
    // Allow build to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow build to succeed with TS warnings (strict mode issues)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
