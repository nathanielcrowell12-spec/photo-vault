import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build for production optimization
  output: 'standalone',

  // External packages for server-side functionality
  // resend is externalized to prevent Turbopack from bundling it during build
  serverExternalPackages: ['jszip', 'unzipper', '@tus/server', '@tus/file-store', 'resend'],

  // Turbopack configuration to alias resend to stub during build
  turbopack: {
    resolveAlias: {
      // Alias resend to stub module to prevent build-time instantiation errors
      'resend': './resend-stub.js',
    },
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
