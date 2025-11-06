# Grid Data API Alternatives - Comprehensive Comparison

## Executive Summary

For Portugal specifically, you have **3 viable options** for getting grid mix data:

1. **Electricity Maps** (what you have) - Best for: ready-to-use data, minimal processing
2. **ENTSO-E** (official EU source) - Best for: free access, official data, DIY approach
3. **Stick with static averages** (CO2.js) - Best for: simple compliance, historical gap filling

---

## Option 1: Electricity Maps (Current Solution)

### ✅ What You Get

- **Carbon Intensity**: ✅ Yes (gCO₂/kWh)
- **Renewable Percentage**: ✅ Yes (calculated for you)
- **Price Data**: ❌ No (requires paid plan)
- **Historical Data**: ❌ No (requires paid plan)
- **Real-time Data**: ✅ Yes (free tier)

### 💰 Cost

- **Free tier**: `/latest` endpoints only
- **Paid tier**: ~€100-500/month (estimate, check their pricing)

### 🔧 Implementation Complexity

- **Low** - Simple JSON API, data ready to use
- Solution already built: `capture-live-grid-mix.ts`

### ✅ Pros

1. Data is pre-calculated (carbon intensity, renewable %)
2. Simple JSON API
3. High quality data
4. Already tested and working
5. Hourly capture strategy already developed

### ❌ Cons

1. No price data on free tier
2. No historical data on free tier
3. Requires paid upgrade for full features

### 📊 Data Quality

- **Source**: Electricity Maps proprietary calculations
- **Update frequency**: 15-60 minutes
- **Accuracy**: High (Tier A for Portugal)

### 🚀 Quick Start

```bash
# Already built and ready to use!
npx tsx scripts/capture-live-grid-mix.ts --dry-run
```

**Recommendation**: ⭐⭐⭐⭐⭐ Best if you value time and simplicity

---

## Option 2: ENTSO-E Transparency Platform (FREE Alternative)

### ✅ What You Get

- **Carbon Intensity**: ⚙️ You calculate (generation data + carbon factors)
- **Renewable Percentage**: ⚙️ You calculate (sum renewables / total)
- **Price Data**: ✅ Yes (day-ahead prices)
- **Historical Data**: ✅ Yes (years of data, FREE!)
- **Real-time Data**: ✅ Yes (free)

### 💰 Cost

- **100% FREE** ✅

### 🔧 Implementation Complexity

- **Medium-High** - XML API, requires data processing

### What You Need to Build

1. **XML Parser**: ENTSO-E returns XML, not JSON
2. **Generation Data Processor**: Parse production by type
3. **Renewable Calculator**: Sum wind + solar + hydro / total
4. **Carbon Calculator**: Apply carbon factors to each source
5. **Cron Job**: Hourly data capture (same as Electricity Maps)

### ✅ Pros

1. **Completely FREE** (no limitations)
2. Official European grid operator data
3. Full historical data access
4. Day-ahead prices included
5. Raw generation data by source
6. Years of historical data available

### ❌ Cons

1. Returns XML (not JSON)
2. You calculate renewable % yourself
3. You calculate carbon intensity yourself
4. More complex API
5. Requires carbon emission factors per source
6. More development work

### 📊 Data Quality

- **Source**: REN (Portuguese TSO) - Official grid operator
- **Update frequency**: 15-60 minutes
- **Accuracy**: Highest possible (official source)

### 🔄 Data Processing Example

```typescript
// ENTSO-E gives you raw generation data:
{
  wind: 1250 MW,
  solar: 300 MW,
  hydro: 890 MW,
  gas: 1340 MW,
  // ... etc
}

// YOU calculate:
const total = wind + solar + hydro + gas + ...
const renewable_pct = (wind + solar + hydro) / total * 100

// YOU calculate carbon intensity:
const carbon = (
  wind * 0 +           // 0 gCO2/kWh
  solar * 0 +          // 0 gCO2/kWh
  hydro * 0 +          // 0 gCO2/kWh
  gas * 490 +          // 490 gCO2/kWh
  // ... etc
) / total
```

### 🚀 Quick Start

```bash
# 1. Register (free) at https://transparency.entsoe.eu/
# 2. Get API token from Account Settings
# 3. Test the API:
export ENTSOE_API_TOKEN="your-token"
npx tsx scripts/test-entsoe-api.ts
```

### 📖 Documentation

- Main site: https://transparency.entsoe.eu/
- API docs: https://transparencyplatform.zendesk.com/hc/en-us/articles/15692855254548
- Portugal EIC code: `10YPT-REN------W`

**Recommendation**: ⭐⭐⭐⭐ Best if you want free access and don't mind extra work

---

## Option 3: CO2.js Static Data (Simplest)

### ✅ What You Get

- **Carbon Intensity**: ✅ Annual average only
- **Renewable Percentage**: ❌ No
- **Price Data**: ❌ No
- **Historical Data**: ✅ Yes (annual averages)
- **Real-time Data**: ❌ No

### 💰 Cost

- **100% FREE** ✅

### 🔧 Implementation Complexity

- **Very Low** - Just import and use

### ✅ Pros

1. Extremely simple to use
2. No API calls needed
3. Good for historical gap filling
4. Acceptable for compliance reporting

### ❌ Cons

1. Annual average only (not hourly)
2. No renewable percentage
3. No real-time data
4. Less accurate

### 🚀 Quick Start

```typescript
import { averageIntensity } from "@tgwf/co2"

const { PRT } = averageIntensity.data
console.log(PRT) // Portugal's annual average
```

**Recommendation**: ⭐⭐ Only for historical gap filling

---

## Side-by-Side Comparison

| Feature | Electricity Maps | ENTSO-E | CO2.js |
|---------|-----------------|---------|--------|
| **Cost** | Free (limited) | Free | Free |
| **Carbon Intensity** | ✅ Ready to use | ⚙️ You calculate | ✅ Annual avg |
| **Renewable %** | ✅ Ready to use | ⚙️ You calculate | ❌ No |
| **Price Data** | ❌ Paid only | ✅ Yes | ❌ No |
| **Historical** | ❌ Paid only | ✅ Years (free) | ✅ Annual only |
| **Real-time** | ✅ Yes | ✅ Yes | ❌ No |
| **Data Format** | JSON | XML | JSON |
| **Complexity** | Low | Medium-High | Very Low |
| **Portugal Coverage** | ✅ Tier A | ✅ Official TSO | ✅ Yes |
| **API Calls** | Required | Required | None |
| **Development Time** | ✅ Already done | 2-3 days | 30 min |

---

## My Recommendation

### For Your Use Case (Portugal, Energy Dashboard, Compliance)

**Best Overall: Electricity Maps (Option 1)** ⭐⭐⭐⭐⭐

**Why:**
1. ✅ Solution already built and tested
2. ✅ Carbon intensity + renewable % ready to use
3. ✅ High quality, simple integration
4. ✅ Can start capturing data immediately
5. ⏰ Saves 2-3 days of development time

**Trade-off:** No price data on free tier

---

### Alternative: ENTSO-E (Option 2) ⭐⭐⭐⭐

**Choose this if:**
- You need price data (day-ahead prices)
- You need historical data (years back)
- You have 2-3 days for development
- You want official TSO data
- You prefer fully free solution

**Trade-off:** More complex, requires XML parsing and calculations

---

### For Historical Gap: CO2.js (Option 3) ⭐⭐

**Use this for:**
- Filling 2022-2023 records with annual averages
- Quick compliance reporting
- When hourly accuracy isn't critical

**Trade-off:** Less accurate (annual vs hourly)

---

## Hybrid Approach (Best of Both Worlds)

You could combine solutions:

1. **For 2022-2023 (historical gap)**: Use CO2.js annual averages
2. **For 2025 onwards (going forward)**: Use Electricity Maps real-time capture
3. **For price data**: Consider ENTSO-E or upgrade Electricity Maps

---

## Action Plan

### If choosing Electricity Maps (Recommended):

1. ✅ Apply database migration (already created)
2. ✅ Run first capture test
3. ✅ Set up hourly cron job
4. ✅ Monitor for 24 hours
5. ✅ Start using data in dashboard

**Time to implement**: 1-2 hours

### If choosing ENTSO-E:

1. Register at transparency.entsoe.eu
2. Get API token
3. Test with `test-entsoe-api.ts`
4. Build XML parser
5. Build carbon calculator
6. Build renewable % calculator
7. Set up hourly capture
8. Test and deploy

**Time to implement**: 2-3 days

### If using CO2.js for historical:

1. Install @tgwf/co2
2. Update existing records
3. Done

**Time to implement**: 30 minutes

---

## Questions to Help You Decide

1. **Do you need price data?**
   - Yes → ENTSO-E or paid Electricity Maps
   - No → Free Electricity Maps

2. **Do you need historical data (2022-2023)?**
   - Yes → ENTSO-E (hourly) or CO2.js (annual averages)
   - No → Electricity Maps real-time capture

3. **How much development time do you have?**
   - 1-2 hours → Electricity Maps
   - 2-3 days → ENTSO-E
   - 30 minutes → CO2.js

4. **What's your budget?**
   - €0 only → ENTSO-E or CO2.js
   - Can pay if needed → Electricity Maps paid tier

---

## Next Steps

What would you like to do?

**Option A**: Continue with Electricity Maps real-time capture (already built)
**Option B**: Explore ENTSO-E API (free, includes prices, requires dev work)
**Option C**: Use CO2.js for historical + Electricity Maps for future
**Option D**: Get pricing quote from Electricity Maps for paid tier

Let me know your preference!
