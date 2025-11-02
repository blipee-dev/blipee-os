/**
 * Next.js Configuration (V2)
 *
 * Enterprise-grade configuration with:
 * - Security headers (CSP, HSTS, etc.)
 * - Performance optimizations
 * - Server Actions configuration
 * - Image optimization
 *
 * IMPORTANT: When migrating to V2, rename this to next.config.js
 *
 * Based on: https://nextjs.org/docs/app/building-your-application/configuring/security-headers
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'localhost:3000',
        '*.blipee.com',
        '*.vercel.app',
      ],
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Production source maps (for error tracking with Sentry)
  productionBrowserSourceMaps: true,

  // Security headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // HSTS: Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self' data:;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live;
              frame-src 'self' https://vercel.live;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'self';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ]
  },

  // Rewrites for API versioning (if needed)
  async rewrites() {
    return [
      // Example: Version API routes
      // {
      //   source: '/api/v2/:path*',
      //   destination: '/api/:path*',
      // },
    ]
  },

  // Redirects
  async redirects() {
    return [
      // Example: Redirect old auth routes
      // {
      //   source: '/login',
      //   destination: '/signin',
      //   permanent: true,
      // },
    ]
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add custom webpack config if needed
    return config
  },

  // Environment variables available to the browser
  // (NEXT_PUBLIC_* vars are automatically included)
  env: {
    APP_NAME: 'Blipee',
    APP_VERSION: '2.0.0',
  },

  // Output configuration
  // output: 'standalone', // For Docker deployment

  // Compiler options
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Logging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
