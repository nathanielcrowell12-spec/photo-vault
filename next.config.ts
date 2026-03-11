import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side functionality
  serverExternalPackages: ['jszip', 'unzipper', '@tus/server', '@tus/file-store'],

  // Image optimization domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'gqmycgopitxpjkxzrnyv.supabase.co',
      },
    ],
  },

  // Fix for multiple lockfiles warning
  turbopack: {
    root: __dirname,
  },
  
  // Security headers (MBP v4.3 requirement)
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    // Content-Security-Policy: restrict resource loading to trusted domains
    const cspDirectives = [
      "default-src 'self'",
      // Next.js requires unsafe-inline for hydration scripts; dev needs unsafe-eval for HMR
      `script-src 'self' 'unsafe-inline' https://js.stripe.com https://us-assets.i.posthog.com${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' https://images.unsplash.com https://*.supabase.co https://tile.openstreetmap.org https://via.placeholder.com data: blob:",
      "font-src 'self'",
      `connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

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
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
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
