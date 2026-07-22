import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Estas libs usan APIs nativas de Node y no deben empaquetarse en el bundle del servidor.
  serverExternalPackages: ["postgres", "ioredis"],
  allowedDevOrigins: ["192.168.0.100"],
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.0.100:3001"],
    },
  },
};

export default nextConfig;
