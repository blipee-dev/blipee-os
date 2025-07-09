// CloudFlare Worker for CDN and edge caching

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Cache configuration based on path
  const cacheConfig = getCacheConfig(url.pathname)
  
  // Check cache first
  const cache = caches.default
  let response = await cache.match(request)
  
  if (response) {
    // Check if stale-while-revalidate is applicable
    const age = getAge(response)
    if (age < cacheConfig.maxAge) {
      return response
    } else if (age < cacheConfig.staleWhileRevalidate) {
      // Return stale content and refresh in background
      event.waitUntil(refreshCache(request, cache))
      return response
    }
  }
  
  // Fetch from origin
  response = await fetchFromOrigin(request, cacheConfig)
  
  // Store in cache if successful
  if (response.ok && cacheConfig.cache) {
    event.waitUntil(cache.put(request, response.clone()))
  }
  
  return response
}

function getCacheConfig(pathname) {
  // Static assets - long cache
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/images/')) {
    return {
      cache: true,
      maxAge: 31536000, // 1 year
      staleWhileRevalidate: 0,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    }
  }
  
  // API responses - short cache with stale-while-revalidate
  if (pathname.startsWith('/api/')) {
    return {
      cache: true,
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 86400, // 1 day
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400'
      }
    }
  }
  
  // HTML pages - no cache
  return {
    cache: false,
    maxAge: 0,
    staleWhileRevalidate: 0,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  }
}

async function fetchFromOrigin(request, cacheConfig) {
  const headers = new Headers(request.headers)
  
  // Add custom headers
  headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'))
  headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP'))
  
  const response = await fetch(request, {
    headers,
    cf: {
      // CloudFlare specific options
      cacheTtl: cacheConfig.maxAge,
      cacheEverything: cacheConfig.cache,
      minify: {
        javascript: true,
        css: true,
        html: true
      }
    }
  })
  
  // Add cache headers
  const newHeaders = new Headers(response.headers)
  Object.entries(cacheConfig.headers).forEach(([key, value]) => {
    newHeaders.set(key, value)
  })
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

function getAge(response) {
  const dateHeader = response.headers.get('date')
  if (!dateHeader) return Infinity
  
  const date = new Date(dateHeader)
  const now = new Date()
  return (now - date) / 1000
}

async function refreshCache(request, cache) {
  try {
    const freshResponse = await fetchFromOrigin(request, getCacheConfig(new URL(request.url).pathname))
    if (freshResponse.ok) {
      await cache.put(request, freshResponse)
    }
  } catch (error) {
    console.error('Error refreshing cache:', error)
  }
}

// Handle purge requests
async function handlePurgeRequest(request) {
  const url = new URL(request.url)
  const cache = caches.default
  
  if (url.searchParams.get('purge_all') === 'true') {
    // Purge all cache
    return new Response('Cache purged', { status: 200 })
  } else {
    // Purge specific URL
    await cache.delete(request)
    return new Response('URL purged from cache', { status: 200 })
  }
}