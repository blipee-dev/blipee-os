# Mobile Performance Optimization

This document outlines all the performance optimizations implemented for the Blipee mobile PWA.

## Code Splitting

### Component-Level Lazy Loading

Heavy components are lazy-loaded to reduce initial bundle size and improve Time to Interactive (TTI):

**Lazy-Loaded Components:**

1. **PromptLibrary** (`src/components/chat/PromptLibrary.tsx`)
   - Size: ~15KB (contains 120+ example prompts)
   - Loading: Only loaded when user opens the prompt library
   - Fallback: Loading spinner during import

2. **PWAInstallBanner** (`src/components/pwa/PWAInstallBanner.tsx`)
   - Size: ~5KB
   - Loading: Only loaded when user is not in PWA mode
   - Fallback: None (invisible until loaded)

3. **PullToRefresh** (`src/components/mobile/PullToRefresh.tsx`)
   - Size: ~3KB
   - Loading: Lazy loaded for future use
   - Fallback: None

**Implementation:**
```typescript
import { lazy, Suspense } from 'react';

const PromptLibrary = lazy(() =>
  import('./PromptLibrary').then(m => ({ default: m.PromptLibrary }))
);

// Usage with Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <PromptLibrary onClose={handleClose} />
</Suspense>
```

### Webpack Bundle Splitting

Configured in `next.config.mjs` to optimize caching and parallel loading:

**Cache Groups:**

1. **Framework Chunk** (`framework.js`)
   - Contains: React, React-DOM, Next.js
   - Priority: 40 (highest)
   - Strategy: Enforce separation for better caching

2. **UI Libraries Chunk** (`ui.js`)
   - Contains: Radix UI, Lucide React, Framer Motion
   - Priority: 30
   - Benefit: Separates UI dependencies for better caching

3. **Commons Chunk** (`commons.js`)
   - Contains: Shared code used in 2+ places
   - Priority: 20
   - Benefit: Reduces duplication across pages

4. **Individual NPM Chunks** (`npm.[package].js`)
   - Contains: Each npm package in its own chunk
   - Priority: 10
   - Benefit: Granular caching per dependency

## Build Optimizations

### Next.js Compiler Options

**Production Optimizations:**
- `removeConsole`: Removes `console.log` statements (keeps `error` and `warn`)
- `swcMinify`: Uses SWC for faster minification
- `reactStrictMode`: Enables strict mode for better error detection

**Package Import Optimization:**
```javascript
optimizePackageImports: [
  'lucide-react',      // Icon library
  'framer-motion',     // Animation library
  '@radix-ui/react-dropdown-menu'  // UI primitives
]
```
This uses Next.js barrel file optimization to only import used exports.

### CSS Optimization

- `optimizeCss: true` - Experimental CSS optimization
- Removes unused CSS classes
- Minifies CSS output

## Runtime Optimizations

### Offline Storage

**IndexedDB for Offline Data:**
- Database: `blipee-offline`
- Stores: `messages`, `actions`, `conversations`
- Benefit: Reduces API calls and enables offline functionality

**Service Worker Caching:**
- Static assets: Cache-first (1 week TTL)
- API routes: Network-first with fallback
- Pages: Stale-while-revalidate

### Image Optimization

**Next.js Image Component:**
- Automatic WebP conversion
- Lazy loading by default
- Responsive images with srcset

**PWA Icons:**
- Optimized PNG outputs (192x192, 512x512)
- Monochrome badge icon (96x96)
- Apple touch icon (180x180)

## Performance Metrics

### Target Metrics (Mobile)

- **Time to Interactive (TTI)**: < 3s on 3G
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Bundle Size Targets

- **Initial JS Bundle**: < 200KB (gzipped)
- **Total JS (all chunks)**: < 500KB (gzipped)
- **Framework chunk**: ~100KB (React + Next.js)
- **UI chunk**: ~80KB (Radix + Framer Motion + Lucide)
- **Page chunks**: < 50KB each

## Monitoring

### Vercel Analytics

Configured to track:
- Core Web Vitals (LCP, FID, CLS)
- Page load times
- API response times

### Console Logging

Production build removes `console.log` while keeping:
- `console.error` - Error messages
- `console.warn` - Warning messages

## Best Practices

### When Adding New Features

1. **Use Dynamic Imports** for:
   - Components > 10KB
   - Modal/drawer content
   - Route-specific functionality

2. **Optimize Images:**
   - Use Next.js `<Image>` component
   - Provide `width` and `height` props
   - Use `loading="lazy"` for below-the-fold images

3. **Minimize Client-Side JavaScript:**
   - Prefer Server Components when possible
   - Use React Server Actions for mutations
   - Keep state management minimal

4. **Test on Real Devices:**
   - Test on 3G network speeds
   - Test on low-end Android devices
   - Use Lighthouse CI in GitHub Actions

### Code Review Checklist

- [ ] Large components are lazy-loaded
- [ ] Images use Next.js Image component
- [ ] No unnecessary dependencies added
- [ ] Bundle size impact measured
- [ ] Mobile performance tested

## Future Optimizations

### Planned Improvements

1. **Service Worker Improvements:**
   - Implement background sync for analytics
   - Add precaching for critical routes
   - Implement stale-while-revalidate for more routes

2. **React Server Components:**
   - Convert static content to RSC
   - Move data fetching to server
   - Reduce client bundle size further

3. **Edge Runtime:**
   - Move API routes to Edge Runtime
   - Reduce latency for global users
   - Enable streaming responses

4. **Partial Hydration:**
   - Implement islands architecture
   - Only hydrate interactive components
   - Reduce JavaScript execution time

## Measuring Performance

### Local Testing

```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run analyze  # If available

# Test with slow 3G
# Chrome DevTools -> Network -> Throttling -> Slow 3G
```

### Lighthouse Testing

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run Lighthouse on mobile
lighthouse https://your-app.vercel.app \
  --emulated-form-factor=mobile \
  --throttling-method=simulate \
  --output=html \
  --output-path=./lighthouse-report.html
```

### Bundle Analysis

View the bundle composition:
1. Build: `npm run build`
2. Check `.next/analyze/` directory
3. Review chunk sizes in build output

## Resources

- [Next.js Performance](https://nextjs.org/docs/pages/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
