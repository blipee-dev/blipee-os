/**
 * Next.js Configuration (V2)
 *
 * Enterprise-grade configuration with:
 * - Security headers (CSP, HSTS, etc.)
 * - Performance optimizations
 * - Server Actions configuration
 * - Image optimization
 * - ISR and caching strategies
 * - Sentry error tracking
 *
 * IMPORTANT: When migrating to V2, rename this to next.config.js
 *
 * Based on: https://nextjs.org/docs/app/building-your-application/configuring/security-headers
 */

const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration (temporarily ignore during builds)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration (temporarily ignore during builds)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Server Actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: [
        'localhost:3000',
        'localhost:3005',
        '*.blipee.com',
        '*.vercel.app',
      ],
    },
    // Enable PPR (Partial Prerendering) when ready for production
    // ppr: 'incremental',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self' data:;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com https://*.sentry.io;
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

  // Output configuration for optimized deployments
  // Uncomment for Docker/standalone deployment
  // output: 'standalone',

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

  // Optimize fonts
  optimizeFonts: true,

  // Enable SWC minification
  swcMinify: true,

  // Strict mode for React
  reactStrictMode: true,

  // Power by header
  poweredByHeader: false,
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses all logs
  silent: true,

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps to Sentry
  // Only enabled when SENTRY_AUTH_TOKEN is set
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Automatically annotate source maps with release information
  widenClientFileUpload: true,

  // Hide source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
}

// Make sure adding Sentry options is the last code to run before exporting
module.exports = process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig
