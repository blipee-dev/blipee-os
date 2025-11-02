# Rate Limiting Setup Guide

## ✅ Implementation Complete

Rate limiting has been successfully implemented using Upstash Redis to protect against:
- Brute force authentication attacks
- API abuse and DoS attacks
- User enumeration attacks

---

## 📋 What's Protected

### Auth Server Actions (5 attempts per 15 minutes)
- ✅ `signIn()` - Login attempts
- ✅ `signUp()` - Account creation
- ✅ `signInWithOAuth()` - OAuth authentication

### Password Reset (3 attempts per 1 hour)
- ✅ `resetPassword()` - Password reset requests
- ✅ `updatePassword()` - Password updates

### Public API Routes (10 requests per minute)
- ✅ `/api/newsletter` - Newsletter subscriptions
- ✅ `/api/contact` - Contact form submissions
- ✅ `/api/support` - Support ticket creation

---

## 🔧 Configuration

### Environment Variables (Already Set)

Your `.env.local` already contains:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

✅ **No additional setup required!**

---

## 🎯 How It Works

### Rate Limit Behavior

**When rate limit is NOT exceeded:**
- Request proceeds normally
- User sees no difference

**When rate limit IS exceeded:**
- **Auth Actions**: User sees toast notification with countdown
  - Example: "Too many login attempts. Please try again in 12 minutes."
- **API Routes**: Returns HTTP 429 with JSON error
  - Example: `{ "error": "Too many requests. Please try again in 45 seconds." }`

### IP Detection

Rate limits are applied per IP address, detected from:
1. `x-forwarded-for` header (Vercel, most proxies)
2. `cf-connecting-ip` header (Cloudflare)
3. `x-real-ip` header (nginx, Apache)
4. Fallback: `"unknown"` (grouped together)

### Development Mode

If Upstash credentials are missing:
- ⚠️ Rate limiting is **disabled**
- Console warning: `"Rate limiting not configured - requests are not being limited"`
- All requests are allowed (development-friendly)

If Redis connection fails:
- 🛡️ Fail-open policy: Request is **allowed**
- Error is logged for monitoring
- Production service continues (availability over strict limiting)

---

## 📊 Rate Limit Configuration

### Current Limits

| Endpoint | Limit | Window | Algorithm |
|----------|-------|--------|-----------|
| Auth (signin/signup) | 5 requests | 15 minutes | Sliding window |
| Password reset | 3 requests | 1 hour | Sliding window |
| Public APIs | 10 requests | 1 minute | Sliding window |

### Sliding Window Algorithm

Upstash uses a sliding window algorithm that:
- ✅ Prevents burst attacks
- ✅ Provides smooth rate limiting
- ✅ More accurate than fixed windows
- ✅ Automatically resets over time

---

## 🧪 Testing Rate Limits

### Test Auth Rate Limiting

```bash
# Send 6 login attempts in a row
for i in {1..6}; do
  curl -X POST http://localhost:3005/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}'
  echo "Attempt $i"
done

# Expected: First 5 succeed (with auth errors), 6th gets rate limited
```

### Test API Rate Limiting

```bash
# Send 11 newsletter subscriptions in a row
for i in {1..11}; do
  curl -X POST http://localhost:3005/api/newsletter \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@test.com"}'
  echo "Request $i"
done

# Expected: First 10 succeed, 11th returns 429 Too Many Requests
```

### Monitor Rate Limits

Check Upstash Dashboard for:
- Request counts
- Rate limit hits
- Geographic distribution
- Top limited IPs

---

## 🔐 Security Benefits

### Prevents Brute Force Attacks
- Attackers cannot try thousands of passwords
- 5 attempts = 15 minute lockout
- Makes credential stuffing impractical

### Prevents User Enumeration
- Combined with generic error messages
- Attackers cannot determine valid emails
- Password reset limited to 3/hour

### Prevents DoS/API Abuse
- Public forms cannot be spammed
- Email sending costs controlled
- Database load protected

### Prevents Account Takeover
- Slows down automated attacks
- Gives time to detect suspicious activity
- Forces distributed attacks (easier to detect)

---

## 📈 Monitoring & Analytics

### Upstash Analytics (Enabled)

The rate limiters have `analytics: true`, which provides:
- Request count per endpoint
- Rate limit hits
- Geographic data
- Time-series graphs

Access via: [Upstash Dashboard](https://console.upstash.com)

### Recommended Alerts

Set up alerts in Upstash for:
- ⚠️ High rate limit hit rate (>10% of requests)
- 🚨 Sustained rate limiting from single IP (potential attack)
- 📊 Unusual traffic patterns

---

## 🛠️ Customizing Limits

To adjust rate limits, edit `/src/lib/rate-limit.ts`:

```typescript
// Example: Stricter auth limits (3 attempts per 30 minutes)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '30 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
})

// Example: More lenient API limits (20 requests per minute)
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
})
```

### Available Time Units
- `'1 s'` - 1 second
- `'1 m'` - 1 minute
- `'1 h'` - 1 hour
- `'1 d'` - 1 day

---

## 🚀 Production Checklist

- [x] Upstash Redis configured
- [x] Rate limiting implemented on auth actions
- [x] Rate limiting implemented on public APIs
- [x] Generic error messages (prevent enumeration)
- [x] User-friendly error messages with countdown
- [x] Analytics enabled
- [ ] Set up Upstash alerts
- [ ] Monitor rate limit hit rates
- [ ] Adjust limits based on legitimate traffic patterns
- [ ] Document any IP whitelisting needs

---

## 🔍 Troubleshooting

### Rate Limiting Not Working

**Check:**
1. Environment variables are set correctly
2. Upstash Redis is active (check dashboard)
3. Server restarted after adding env vars
4. Network allows connection to Upstash

**Debug:**
```bash
# Check if Redis is reachable
curl https://your-redis.upstash.io/ping \
  -H "Authorization: Bearer your-redis-token-here"

# Should return: {"result":"PONG"}
```

### False Positives (Legitimate Users Blocked)

**Solutions:**
1. Increase rate limits for specific endpoints
2. Implement user-based rate limiting (after login)
3. Add captcha for repeated failed attempts
4. Whitelist trusted IPs (office, VPN)

### Rate Limit Bypassing

**If attackers bypass via IP rotation:**
1. Add device fingerprinting
2. Implement account-level rate limits
3. Add captcha after N failed attempts
4. Use Cloudflare Bot Management

---

## 📚 Additional Resources

- [Upstash Rate Limiting Docs](https://upstash.com/docs/redis/features/ratelimit)
- [Next.js Security Best Practices](https://nextjs.org/docs/going-to-production#security)
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)

---

## ✅ Summary

Rate limiting is **fully implemented and active** with your existing Upstash Redis credentials. The system is:
- ✅ Protecting all authentication endpoints
- ✅ Protecting all public API routes
- ✅ Providing user-friendly error messages
- ✅ Collecting analytics
- ✅ Production-ready

No additional configuration needed! 🎉
