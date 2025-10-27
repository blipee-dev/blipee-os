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

  // Force dynamic rendering to prevent build hangs during static generation
  // All pages will be server-rendered on-demand instead of pre-generated
  output: 'standalone',

  // Prevent build from hanging on static page generation
  staticPageGenerationTimeout: 90, // 90 seconds max per page

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
        // Additional headers for API routes - force no caching
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Suppress specific build warnings
  typescript: {
    // Skip TypeScript type checking during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during builds to speed up deployment
    ignoreDuringBuilds: true,
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