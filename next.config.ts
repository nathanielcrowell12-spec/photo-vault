import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone build for production optimization
  output: 'standalone',

  // External packages for server-side functionality
  // resend is externalized to prevent Turbopack from bundling it during build
  serverExternalPackages: ['jszip', 'unzipper', '@tus/server', '@tus/file-store', 'resend'],

  // Webpack configuration to use stub during build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Replace resend with stub during build to prevent instantiation errors
      config.resolve.alias = {
        ...config.resolve.alias,
        'resend': path.resolve(__dirname, 'resend-stub.js'),
      };
    }
    return config;
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
