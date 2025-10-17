import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['jszip', 'unzipper', '@tus/server', '@tus/file-store'],
};

export default nextConfig;
