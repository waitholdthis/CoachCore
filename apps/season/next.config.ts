import type { NextConfig } from "next";

const apiUrl = process.env.SEASON_API_INTERNAL_URL ?? "http://localhost:8002";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      { source: "/ws/:path*", destination: `${apiUrl}/ws/:path*` },
    ];
  },
};

export default nextConfig;
