# Frontend Optimization Guide

**FASE 3 - Week 2: Performance & Optimization**

This document outlines frontend performance optimizations implemented to achieve:
- Initial page load < 2s
- Time to Interactive (TTI) < 3s
- Bundle size < 500KB (gzipped)
- Lighthouse Performance Score > 90

---

## 1. Bundle Optimization

### Code Splitting Strategies

#### Dynamic Imports
Use dynamic imports for heavy components:

```typescript
// ❌ Bad: Loads everything upfront
import { UnifiedDashboard } from '@/components/integrations/UnifiedDashboard';

// ✅ Good: Loads on demand
const UnifiedDashboard = dynamic(() =>
  import('@/components/integrations/UnifiedDashboard').then(mod => ({ default: mod.UnifiedDashboard })),
  { loading: () => <Loader2 className="animate-spin" /> }
);
```

#### Route-Based Code Splitting
Next.js automatically code-splits by route. Keep pages lightweight:

```typescript
// app/dashboard/page.tsx - Keep minimal
export default function DashboardPage() {
  return <DashboardContainer />; // Loaded dynamically
}
```

### Tree Shaking

Ensure proper tree-shaking by using named imports:

```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash';

// ✅ Good: Only imports what's needed
import { debounce } from 'lodash-es';
```

### Bundle Analysis

Run bundle analysis regularly:

```bash
npm run build
# Next.js will show bundle sizes

# For detailed analysis:
ANALYZE=true npm run build
```

---

## 2. Image Optimization

### Next.js Image Component

Always use Next.js `Image` component:

```typescript
import Image from 'next/image';

// ✅ Optimized images with lazy loading
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority={false} // Only true for above-the-fold images
  loading="lazy"
/>
```

### Image Formats
- Use WebP for modern browsers
- Provide PNG/JPEG fallbacks
- Compress images before upload (TinyPNG, Squoosh)

---

## 3. Component Optimization

### Memoization

Use React.memo for expensive components:

```typescript
import { memo } from 'react';

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Complex rendering logic
  return <div>{/* ... */}</div>;
});
```

### useMemo and useCallback

Memoize expensive computations and callbacks:

```typescript
import { useMemo, useCallback } from 'react';

function DataTable({ data, onRowClick }) {
  // Memoize expensive calculations
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.value - b.value);
  }, [data]);

  // Memoize callbacks to prevent child re-renders
  const handleRowClick = useCallback((id) => {
    onRowClick(id);
  }, [onRowClick]);

  return <Table data={sortedData} onRowClick={handleRowClick} />;
}
```

### Virtualization

For long lists, use virtualization:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeList({ items }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div key={virtualItem.index}>{items[virtualItem.index]}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Data Fetching Optimization

### Server Components

Use React Server Components for data fetching:

```typescript
// app/dashboard/page.tsx - Server Component
async function DashboardPage() {
  const data = await fetchDashboardData(); // Runs on server
  return <Dashboard data={data} />;
}
```

### Parallel Data Fetching

Fetch data in parallel when possible:

```typescript
// ❌ Bad: Sequential fetching
const users = await fetchUsers();
const posts = await fetchPosts();
const comments = await fetchComments();

// ✅ Good: Parallel fetching
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);
```

### Caching with SWR

For client-side data fetching, use SWR:

```typescript
import useSWR from 'swr';

function Profile() {
  const { data, error, isLoading } = useSWR('/api/user', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000, // 5 seconds
  });

  if (isLoading) return <Loading />;
  if (error) return <Error />;
  return <div>{data.name}</div>;
}
```

---

## 5. Performance Monitoring

### Web Vitals

Track Core Web Vitals:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### Custom Performance Tracking

```typescript
import { PerformanceUtils } from '@/lib/performance/performance-monitor';

function MyComponent() {
  useEffect(() => {
    const timer = PerformanceUtils.trackComponentRender('MyComponent');
    return () => timer.end();
  }, []);

  return <div>Content</div>;
}
```

---

## 6. CSS Optimization

### Tailwind CSS Purging

Ensure Tailwind purges unused CSS:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Only includes used classes in production
};
```

### Critical CSS

Inline critical CSS for above-the-fold content:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: criticalCss // Inline critical CSS
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 7. JavaScript Optimization

### Minimize JavaScript

- Remove console.logs in production
- Remove unused code
- Use minification (Next.js does this automatically)

### Defer Non-Critical Scripts

```typescript
<Script
  src="https://analytics.example.com/script.js"
  strategy="lazyOnload" // Loads after page is interactive
/>
```

---

## 8. Caching Strategies

### Static Generation (SSG)

Use SSG for pages that don't change often:

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

### Incremental Static Regeneration (ISR)

For pages that need periodic updates:

```typescript
export const revalidate = 3600; // Revalidate every hour

export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

---

## 9. Next.js Configuration

Optimize Next.js config:

```javascript
// next.config.js
const nextConfig = {
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production client-side optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
        },
      };
    }
    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
};

module.exports = nextConfig;
```

---

## 10. Performance Checklist

### Before Deployment

- [ ] Run Lighthouse audit (Score > 90)
- [ ] Check bundle sizes (`npm run build`)
- [ ] Test on slow 3G network
- [ ] Verify images are optimized
- [ ] Check for unused dependencies
- [ ] Test with React DevTools Profiler
- [ ] Verify caching headers are set
- [ ] Test API response times (< 200ms)

### Monitoring

- [ ] Set up Web Vitals tracking
- [ ] Monitor bundle size over time
- [ ] Track API performance
- [ ] Monitor error rates
- [ ] Set performance budgets

---

## 11. Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.8s | ✅ |
| Largest Contentful Paint (LCP) | < 2.5s | ✅ |
| Time to Interactive (TTI) | < 3.0s | ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | ✅ |
| First Input Delay (FID) | < 100ms | ✅ |
| Initial Bundle Size (gzipped) | < 200KB | ✅ |
| API Response Time (p95) | < 200ms | ✅ |

---

## 12. Tools

### Analysis
- **Lighthouse**: Chrome DevTools → Lighthouse
- **Bundle Analyzer**: `ANALYZE=true npm run build`
- **React DevTools Profiler**: Chrome Extension
- **WebPageTest**: https://webpagetest.org

### Monitoring
- **Vercel Analytics**: Built-in
- **Sentry**: Error tracking
- **DataDog**: APM and RUM
- **Custom**: `/api/performance/metrics`

---

**Updated:** Week 2 - FASE 3
**Status:** ✅ Optimized
