# Electricity Maps API - Test Results

**Date**: 2025-11-06
**API Key Tested**: `T4xEjR2XyjTyEmfqRYh1`
**Base URL**: `https://api.electricitymaps.com/v3`

---

## 🚨 Test Summary

**Status**: ❌ **ALL TESTS FAILED - ACCESS DENIED**

All endpoint tests returned **HTTP 403 - Access denied** with all tested zones and authentication formats.

---

## 📋 Tests Performed

### 1. Endpoint: `/carbon-intensity/latest`

#### Zones Tested:
- ❌ PT (Portugal)
- ❌ DE (Germany)
- ❌ FR (France)
- ❌ ES (Spain)
- ❌ GB (Great Britain)
- ❌ US-CAL-CISO (California)

**Result**: All returned `Access denied`

```bash
curl "https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=PT" \
  -H "auth-token: T4xEjR2XyjTyEmfqRYh1"
# Response: Access denied
# HTTP Status: 403
```

---

### 2. Authentication Header Formats Tested

Tried multiple header formats to rule out format issues:

| Format | Header | Result |
|--------|--------|--------|
| Standard | `auth-token: T4xEjR2XyjTyEmfqRYh1` | ❌ Access denied |
| Bearer | `Authorization: Bearer T4xEjR2XyjTyEmfqRYh1` | ❌ Access denied |
| X-Auth | `x-auth-token: T4xEjR2XyjTyEmfqRYh1` | ❌ Access denied |

**Conclusion**: Format is correct (as per documentation), issue is with the API key itself.

---

### 3. API Service Status

```bash
curl -I "https://api.electricitymaps.com/v3/"
# Response: HTTP/1.1 200 OK
```

✅ **API is online and responding**
❌ **Authentication is failing**

---

## 🔍 Root Cause Analysis

Based on the test results, the most likely causes are:

### 1. **Invalid or Expired API Key** (Most Likely)
The API key `T4xEjR2XyjTyEmfqRYh1` appears to be:
- Incorrect
- Expired
- Revoked
- Never activated

### 2. **Insufficient Permissions**
The API key may exist but lack permissions for:
- The tested zones (PT, DE, FR, ES, GB, US-CAL-CISO)
- The `/carbon-intensity/latest` endpoint
- Any v3 endpoints

### 3. **Account Status**
Possible account issues:
- Trial period ended
- Payment issue
- Account suspended
- API key not properly generated

---

## ✅ Recommended Actions

### Immediate Actions:

1. **Verify API Key**
   - Log into Electricity Maps dashboard
   - Check API keys section
   - Confirm the key is active and not expired
   - Regenerate if necessary

2. **Check Account Status**
   - Verify account is active
   - Check billing status
   - Confirm subscription/plan is active

3. **Review Permissions**
   - Check which zones are available in your plan
   - Verify endpoint access permissions
   - Review rate limits and quotas

4. **Contact Support**
   If API key appears correct:
   ```
   Email: support@electricitymaps.com
   Provide: API key, error message, timestamp
   ```

---

## 📝 Alternative Testing Steps

Once you have a valid API key, test with:

### 1. Test Basic Access
```bash
# Check available zones with your plan
curl "https://api.electricitymaps.com/v3/zones" \
  -H "auth-token: YOUR_VALID_KEY"
```

### 2. Test Latest Data
```bash
# Get latest carbon intensity
curl "https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=PT" \
  -H "auth-token: YOUR_VALID_KEY"
```

### 3. Test Historical Data
```bash
# Get last 24 hours
curl "https://api.electricitymaps.com/v3/carbon-intensity/history?zone=PT" \
  -H "auth-token: YOUR_VALID_KEY"
```

### 4. Test Past Data
```bash
# Get specific datetime
curl "https://api.electricitymaps.com/v3/carbon-intensity/past?zone=PT&datetime=2025-11-05T15:00Z" \
  -H "auth-token: YOUR_VALID_KEY"
```

### 5. Test Past Range
```bash
# Get date range (max 10 days for hourly)
curl "https://api.electricitymaps.com/v3/carbon-intensity/past-range?zone=PT&start=2025-11-04T00:00Z&end=2025-11-05T00:00Z" \
  -H "auth-token: YOUR_VALID_KEY"
```

### 6. Test Forecast
```bash
# Get forecast (default 24h)
curl "https://api.electricitymaps.com/v3/carbon-intensity/forecast?zone=PT" \
  -H "auth-token: YOUR_VALID_KEY"
```

---

## 🧪 Complete Test Suite (For Valid Key)

Once you have a valid API key, run this comprehensive test:

```bash
#!/bin/bash

API_KEY="YOUR_VALID_API_KEY_HERE"
BASE_URL="https://api.electricitymaps.com/v3"
ZONE="PT"

echo "==================================="
echo "Electricity Maps API Test Suite"
echo "==================================="
echo ""

# Test 1: Zones
echo "1. Testing /zones endpoint..."
curl -s "$BASE_URL/zones" \
  -H "auth-token: $API_KEY" | jq -r "keys | .[]" | head -10
echo ""

# Test 2: Latest
echo "2. Testing /carbon-intensity/latest..."
curl -s "$BASE_URL/carbon-intensity/latest?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq .
echo ""

# Test 3: History
echo "3. Testing /carbon-intensity/history..."
curl -s "$BASE_URL/carbon-intensity/history?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq '.history | length'
echo ""

# Test 4: Past
echo "4. Testing /carbon-intensity/past..."
curl -s "$BASE_URL/carbon-intensity/past?zone=$ZONE&datetime=2025-11-05T15:00Z" \
  -H "auth-token: $API_KEY" | jq .
echo ""

# Test 5: Past Range
echo "5. Testing /carbon-intensity/past-range..."
curl -s "$BASE_URL/carbon-intensity/past-range?zone=$ZONE&start=2025-11-04T00:00Z&end=2025-11-05T00:00Z" \
  -H "auth-token: $API_KEY" | jq '.data | length'
echo ""

# Test 6: Forecast
echo "6. Testing /carbon-intensity/forecast..."
curl -s "$BASE_URL/carbon-intensity/forecast?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq '.forecast | length'
echo ""

# Test 7: Renewable Energy
echo "7. Testing /renewable-energy/latest..."
curl -s "$BASE_URL/renewable-energy/latest?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq .
echo ""

# Test 8: Electricity Mix
echo "8. Testing /electricity-mix/latest..."
curl -s "$BASE_URL/electricity-mix/latest?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq '.data[0].mix | keys'
echo ""

# Test 9: Power Breakdown (deprecated but still works)
echo "9. Testing /power-breakdown/latest..."
curl -s "$BASE_URL/power-breakdown/latest?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq '.powerConsumptionBreakdown | keys'
echo ""

# Test 10: Price
echo "10. Testing /price-day-ahead/latest..."
curl -s "$BASE_URL/price-day-ahead/latest?zone=$ZONE" \
  -H "auth-token: $API_KEY" | jq .
echo ""

echo "==================================="
echo "Test Suite Complete"
echo "==================================="
```

Save this as `test-electricity-maps.sh` and run:
```bash
chmod +x test-electricity-maps.sh
./test-electricity-maps.sh
```

---

## 📊 Expected Responses (With Valid Key)

### Carbon Intensity Latest
```json
{
  "zone": "PT",
  "carbonIntensity": 245,
  "datetime": "2025-11-06T18:00:00.000Z",
  "updatedAt": "2025-11-06T18:15:00.000Z",
  "emissionFactorType": "lifecycle",
  "isEstimated": false,
  "temporalGranularity": "hourly"
}
```

### Carbon Intensity History
```json
{
  "zone": "PT",
  "history": [
    {
      "carbonIntensity": 250,
      "datetime": "2025-11-05T18:00:00.000Z",
      "updatedAt": "2025-11-05T18:30:00.000Z",
      "emissionFactorType": "lifecycle",
      "isEstimated": false
    },
    // ... 23 more hours
  ],
  "temporalGranularity": "hourly"
}
```

### Renewable Energy
```json
{
  "zone": "PT",
  "datetime": "2025-11-06T18:00:00.000Z",
  "updatedAt": "2025-11-06T18:15:00.000Z",
  "unit": "%",
  "value": "68",
  "isEstimated": false,
  "temporalGranularity": "hourly"
}
```

---

## 🔒 Security Best Practices

1. **Never expose API key in frontend code**
2. **Use environment variables**:
   ```bash
   export ELECTRICITY_MAPS_API_KEY="your-key-here"
   ```
3. **Create a backend proxy** to protect the key
4. **Rotate keys regularly**
5. **Monitor usage** to detect anomalies

---

## 📚 Resources

- **Official Docs**: https://api-portal.electricitymaps.com/
- **Methodology**: https://www.electricitymaps.com/methodology
- **Support**: support@electricitymaps.com
- **Status Page**: (check if they have one)

---

## 🎯 Next Steps for Blipee Integration

Once you have a valid API key:

1. **Create Service Module**
   ```typescript
   // src/services/electricityMaps.ts
   export class ElectricityMapsService {
     private apiKey: string;
     private baseUrl = 'https://api.electricitymaps.com/v3';

     async getCarbonIntensity(zone: string, date?: Date) {
       // Implementation
     }
   }
   ```

2. **Store Data in Database**
   - Create `electricity_metrics` table
   - Store hourly carbon intensity data
   - Cache data to reduce API calls

3. **Create Dashboard**
   - Real-time carbon intensity widget
   - Historical trends charts
   - Renewable % tracker

4. **ESG Reporting Integration**
   - Calculate Scope 2 emissions
   - Generate GRI 305 reports
   - Track renewable energy usage

---

**Status**: Waiting for valid API key to proceed with integration tests.
