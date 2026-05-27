import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network access for development
  allowedDevOrigins: ["192.168.0.106", "localhost", "127.0.0.1"],
};

export default nextConfig;
