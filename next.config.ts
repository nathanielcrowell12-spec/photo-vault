import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side functionality
  serverExternalPackages: ['jszip', 'unzipper', '@tus/server', '@tus/file-store'],

  // Fix for multiple lockfiles warning
  turbopack: {
    root: __dirname,
  },
  
  // Security headers (MBP v4.3 requirement)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
