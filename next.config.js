const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable instrumentation hook
  experimental: {
    instrumentationHook: true,
  },
  
  // Skip TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Exclude TensorFlow from serverless functions to stay under 250MB limit
  // ML models will fail gracefully and fall back to simpler algorithms
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@tensorflow/**',
      'node_modules/@tensorflow/tfjs-node/**',
      'node_modules/@tensorflow/tfjs-core/**',
      'node_modules/@tensorflow/tfjs-layers/**',
      'node_modules/@tensorflow/tfjs-converter/**',
      'node_modules/@tensorflow/tfjs-backend-webgl/**',
      'node_modules/@tensorflow/tfjs-backend-cpu/**',
    ],
  },
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Bundle analysis
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Note: Preact replacement removed due to compatibility issues
      // Consider using it only for specific components if needed
    }

    // TensorFlow.js and Supabase compatibility fixes
    if (isServer) {
      // Handle webpack compatibility issues
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
        '@tensorflow/tfjs': 'commonjs @tensorflow/tfjs',
        '@tensorflow/tfjs-core': 'commonjs @tensorflow/tfjs-core',
        '@tensorflow/tfjs-layers': 'commonjs @tensorflow/tfjs-layers',
        '@tensorflow/tfjs-converter': 'commonjs @tensorflow/tfjs-converter',
        '@tensorflow/tfjs-backend-webgl': 'commonjs @tensorflow/tfjs-backend-webgl',
        '@tensorflow/tfjs-backend-cpu': 'commonjs @tensorflow/tfjs-backend-cpu',
        'seedrandom': 'commonjs seedrandom',
        'set-cookie-parser': 'commonjs set-cookie-parser',
        'whatwg-url': 'commonjs whatwg-url',
        'jose': 'commonjs jose'
      });

      // Handle Supabase auth helpers externally for server builds
      config.externals.push(function (context, request, callback) {
        if (request === '@supabase/auth-helpers-nextjs') {
          return callback(null, 'commonjs @supabase/auth-helpers-nextjs');
        }
        callback();
      });

      // Fix for __webpack_require__.nmd issue
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\.js$/,
        include: /node_modules\/seedrandom/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-modules-commonjs']
          }
        }
      });
    }

    // Enable webpack bundle analyzer
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'framer-motion',
    ],
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          }] : []),
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for performance
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);