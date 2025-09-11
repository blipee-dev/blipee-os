/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https: http:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.deepseek.com https://api.openweathermap.org https://vitals.vercel-insights.com;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["quovvwrwyfkzhgqdeham.supabase.co"],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Additional headers for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Suppress specific build warnings
  typescript: {
    // Don't fail build on TS errors (we've already fixed them)
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't fail build on ESLint errors (we've already fixed them)
    ignoreDuringBuilds: false,
  },
  
  // Experimental features to improve build
  experimental: {
    // Optimize for smaller bundles
    optimizeCss: true,
  },
  
  // Webpack configuration
  webpack: (config, { dev }) => {
    if (dev) {
      // Suppress cache serialization warnings in development
      config.cache = {
        type: 'filesystem',
        compression: false,
      };
    }
    return config;
  },
};

export default nextConfig;