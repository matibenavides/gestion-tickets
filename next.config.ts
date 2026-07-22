import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Estas libs usan APIs nativas de Node y no deben empaquetarse en el bundle del servidor.
  serverExternalPackages: ["postgres", "ioredis"],
};

export default nextConfig;
