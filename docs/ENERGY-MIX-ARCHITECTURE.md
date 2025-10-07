# Energy Mix Architecture

## Overview

The energy mix system uses a **3-tier hybrid approach** to provide the most accurate renewable/non-renewable split for energy consumption data:

1. **Invoice Data** (Primary) - Most accurate, supplier-specific
2. **Electricity Maps API** (Secondary) - Real-time grid data for 200+ countries
3. **Reference Table** (Fallback) - Manually entered data for edge cases

## Data Flow

```
User uploads invoice → AI extracts energy mix → Stored in metadata
                            ↓ (if not in invoice)
                      Electricity Maps API → Grid mix by country/date
                            ↓ (if API fails)
                      Reference table → Fallback data
```

## Architecture Components

### 1. Invoice Parsing (Primary Source)

**Location**: `/src/lib/data/document-parser.ts`

When users upload energy invoices, the AI extracts:
- Consumption amount
- Period (month/year)
- Cost
- **Energy mix** (if available on invoice)
- **Detailed sources** (wind, solar, gas, coal percentages)

**Storage**: Directly in `metrics_data.metadata.grid_mix`

```json
{
  "invoice_data": {
    "invoice_number": "INV-2025-001",
    "supplier": "EDP",
    "extracted_at": "2025-01-15"
  },
  "grid_mix": {
    "provider": "EDP",
    "period": "2025-01",
    "renewable_percentage": 56.99,
    "renewable_kwh": 569.9,
    "non_renewable_kwh": 430.1,
    "sources": [
      {"name": "Wind", "percentage": 11.38, "renewable": true},
      {"name": "Hydro", "percentage": 31.22, "renewable": true},
      {"name": "Solar", "percentage": 8.2, "renewable": true},
      {"name": "Biomass", "percentage": 6.19, "renewable": true},
      {"name": "Natural Gas", "percentage": 28.35, "renewable": false},
      {"name": "Coal", "percentage": 0.58, "renewable": false},
      {"name": "Nuclear", "percentage": 10.57, "renewable": false}
    ],
    "source": "invoice_parsing"
  }
}
```

**Advantages**:
- ✅ Most accurate (actual supplier data)
- ✅ Supplier-specific (not generic grid mix)
- ✅ Historically accurate for compliance reporting

### 2. Electricity Maps API (Secondary Source)

**Location**: `/src/lib/external/electricity-maps.ts`

**API Key**: `ELECTRICITY_MAPS_API_KEY=T4xEjR2XyjTyEmfqRYh1`

**Endpoints**:
- `/api/energy/grid-mix?country_code=PT` - Fetch latest grid mix
- `/api/energy/grid-mix?country_code=PT&datetime=2025-01-15T12:00:00Z` - Historical

**Features**:
- 200+ countries supported
- Real-time + historical data (back to 2015)
- Hourly granularity
- Carbon intensity (gCO2eq/kWh)
- Detailed source breakdown

**Example API Response** (Portugal, October 2025):
```json
{
  "zone": "PT",
  "datetime": "2025-10-07T09:00:00.000Z",
  "renewable_percentage": 75,
  "sources": [
    {"name": "Solar", "percentage": 36.8, "renewable": true},
    {"name": "Hydro", "percentage": 25.6, "renewable": true},
    {"name": "Natural Gas", "percentage": 21.5, "renewable": false},
    {"name": "Biomass", "percentage": 5.4, "renewable": true},
    {"name": "Hydro Storage", "percentage": 6.4, "renewable": true},
    {"name": "Nuclear", "percentage": 3.2, "renewable": false},
    {"name": "Wind", "percentage": 0.8, "renewable": true}
  ],
  "source": "electricity_maps_api"
}
```

**Advantages**:
- ✅ Real-time data
- ✅ Global coverage
- ✅ Automatically updated
- ✅ No manual data entry needed

**Usage**:
```typescript
import { getLatestPowerBreakdown, convertToEnergyMix } from '@/lib/external/electricity-maps';

const breakdown = await getLatestPowerBreakdown('PT');
const energyMix = convertToEnergyMix(breakdown);
```

### 3. Reference Table (Fallback Source)

**Migration**: `supabase/migrations/20251007_energy_mix_metadata_all_types.sql`

**Table**: `energy_mix_metadata`

Used for:
- Edge cases where Electricity Maps doesn't have data
- Manual data entry for specific suppliers
- Historical data before 2015
- Testing and development

**Schema**:
```sql
CREATE TABLE energy_mix_metadata (
  id UUID PRIMARY KEY,
  energy_type TEXT, -- electricity, district_heating, district_cooling, steam
  provider_name TEXT,
  country_code TEXT,
  region TEXT,
  year INTEGER,
  month INTEGER,
  renewable_percentage DECIMAL(5,2),
  non_renewable_percentage DECIMAL(5,2),
  sources JSONB, -- [{name, percentage, renewable}]
  source_url TEXT,
  data_quality TEXT, -- verified, estimated, modeled
  UNIQUE(provider_name, energy_type, country_code, year, month, region)
);
```

## Smart Metadata Population

**Function**: `auto_add_grid_mix_metadata()` (database trigger)

**Logic**:
```sql
1. Check if metadata already has grid_mix (from invoice parsing)
   → If YES: Keep it (don't override)

2. If NO grid_mix, try Electricity Maps API
   → Call API for site's country + consumption date
   → Store result in metadata

3. If API fails, fallback to reference table
   → Query energy_mix_metadata by country + year
   → Store result with source='reference_data'
```

**Trigger**:
```sql
CREATE TRIGGER trigger_auto_add_grid_mix
  BEFORE INSERT ON metrics_data
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_grid_mix_metadata();
```

## Frontend Integration

**Component**: `/src/components/dashboard/EnergyDashboard.tsx`

**API**: `/src/app/api/energy/sources/route.ts`

The Energy Dashboard automatically:
1. Fetches all energy metrics with metadata
2. Aggregates grid mix data by energy type
3. Displays dynamic cards for each energy type:
   - **Electricity Grid Mix** (with Zap icon)
   - **District Heating Mix** (with Flame icon)
   - **District Cooling Mix** (with Droplets icon)
   - **Steam Mix** (with Factory icon)

**Visualization**:
- Pie chart showing detailed source breakdown
- Color-coded by renewable (green) vs non-renewable (gray)
- Percentage labels
- Provider and year info

## Multi-Type Support

The system supports energy mix for:

### Electricity
- Grid mix from national grid operator
- Or supplier-specific mix from invoice
- Metadata key: `grid_mix`

### District Heating/Cooling/Steam
- Supplier-specific mix only (no national "grid")
- Must come from invoice or manual entry
- Metadata key: `supplier_mix`

## Data Sources Priority

For any energy record, the system uses:

1. **Invoice data** (if available) - 100% accurate
2. **Electricity Maps API** (if electricity) - Real-time accurate
3. **Reference table** (fallback) - Manually entered

**Source Tracking**: Each metadata object includes `source` field:
- `invoice_parsing` - From uploaded invoice (most trusted)
- `electricity_maps_api` - From API (highly trusted)
- `reference_data` - From manual entry (trusted)

## Implementation Status

✅ **Completed**:
- Electricity Maps API integration
- API endpoint `/api/energy/grid-mix`
- Frontend multi-type energy mix display
- API aggregation of mix data

⏳ **Pending**:
- Update document parser to extract energy mix from invoices
- Apply database migrations (reference table + trigger)
- Update trigger to call Electricity Maps API
- Test with real PLMJ invoices

## Testing

### Test Electricity Maps API:
```bash
# Test Portugal grid mix
curl -X GET 'https://api.electricitymap.org/v3/power-breakdown/latest?zone=PT' \
  -H 'auth-token: T4xEjR2XyjTyEmfqRYh1'

# Via our API endpoint
curl http://localhost:3000/api/energy/grid-mix?country_code=PT
```

### Test Energy Dashboard:
1. Add electricity consumption data
2. Navigate to Energy Dashboard
3. Verify "Electricity Grid Mix" card displays
4. Check detailed pie chart with sources

## Future Enhancements

1. **Hourly Grid Mix**: Use hourly Electricity Maps data for more accurate emissions
2. **Predictive Mix**: Forecast future grid mix based on historical trends
3. **Optimization**: Recommend best times to consume electricity based on renewable %
4. **Real-time Alerts**: Notify when grid is >80% renewable
5. **Supplier Comparison**: Compare actual supplier mix vs grid mix

## API Rate Limits

**Electricity Maps**:
- Free tier: 1000 requests/month
- Recommended: Cache responses for 1 hour (real-time) or 24 hours (historical)
- Current implementation: Caching enabled via Next.js `next.revalidate`

## Security

- API key stored in `.env.local` (never committed)
- Server-side only (not exposed to client)
- RLS policies on `energy_mix_metadata` table
- Only authenticated users can read grid mix data
- Only super admins can modify reference data
