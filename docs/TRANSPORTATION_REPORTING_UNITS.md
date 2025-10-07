# Transportation Emissions Reporting Units

## GHG Protocol & GRI 305 Standards

### Primary Reporting Units

**Emissions (All Scopes):**
- **Standard Unit**: `tCO2e` (metric tonnes of CO2 equivalent)
- **Alternative**: `kgCO2e` for smaller values or detailed tracking
- **Note**: GRI 305 requires reporting in metric tonnes CO2e

### Activity Data Units

#### Business Travel (Scope 3)

**Air Travel:**
- Distance: `km` (kilometers)
- Emission Factor: `kgCO2e/km` or `kgCO2e/passenger-km`
- Common Segmentation: Short-haul (<500km), Medium-haul (500-1600km), Long-haul (>1600km)

**Rail Travel:**
- Distance: `km` (kilometers)
- Emission Factor: `kgCO2e/km` or `kgCO2e/passenger-km`

**Road Travel (Business):**
- Distance: `km` (kilometers)
- Emission Factor: `kgCO2e/km` or `kgCO2e/vehicle-km`

**Hotel Stays:**
- Activity: `nights` (number of nights)
- Emission Factor: `kgCO2e/night`

#### Fleet Vehicles (Scope 1)

**Fuel-Based Method** (More accurate when fuel data available):
- **Gasoline**: `liters` or `gallons`
- **Diesel**: `liters` or `gallons`
- **LPG**: `liters` or `kg`
- **CNG**: `m³` (cubic meters) or `kg`
- **Biodiesel**: `liters`
- **Ethanol**: `liters`
- Emission Factor: `kgCO2e/liter`, `kgCO2e/m³`, or `kgCO2e/kg`

**Distance-Based Method** (When only distance data available):
- Distance: `km` (kilometers)
- Emission Factor: `kgCO2e/km` (varies by vehicle type, fuel, size)

**Electric Vehicles** (Scope 2):
- Electricity: `kWh` (kilowatt-hours)
- Emission Factor: `kgCO2e/kWh` (based on grid emission factor)

### Dashboard Display Recommendations

#### Summary Metrics

```
Total Emissions: XXX.X tCO2e
Total Distance: XXX,XXX km
Total Fuel: XX,XXX liters
Emission Intensity: XX.X kgCO2e/km (or gCO2e/km for very efficient transport)
```

#### By Transport Mode

**Business Travel:**
```
✈️ Air Travel:
   - Distance: 4,895,783 km
   - Emissions: 734.4 tCO2e
   - Intensity: 150 gCO2e/km

🚆 Rail Travel:
   - Distance: 134,536 km
   - Emissions: 5.2 tCO2e
   - Intensity: 39 gCO2e/km

🚗 Road Travel:
   - Distance: XX,XXX km
   - Emissions: XX.X tCO2e
   - Intensity: XXX gCO2e/km

🏨 Hotel Stays:
   - Nights: XXX
   - Emissions: XX.X tCO2e
   - Intensity: XX.X kgCO2e/night
```

**Fleet:**
```
⛽ Diesel:
   - Fuel: 12,500 liters
   - Emissions: 33.1 tCO2e
   - Intensity: 2.65 kgCO2e/liter

⚡ Electric:
   - Energy: 5,000 kWh
   - Emissions: 2.3 tCO2e
   - Intensity: 0.46 kgCO2e/kWh
```

### Unit Conversion Reference

**Distance:**
- 1 km = 0.621371 miles
- 1 mile = 1.60934 km

**Volume (Liquid Fuel):**
- 1 liter = 0.264172 gallons (US)
- 1 gallon (US) = 3.78541 liters

**Volume (Gas):**
- 1 m³ = 35.3147 cubic feet
- 1 m³ CNG ≈ 0.65-0.75 kg (varies by pressure)

**Mass:**
- 1 kg = 2.20462 pounds
- 1 tonne (metric ton) = 1,000 kg = 2,204.62 pounds

**Emissions:**
- 1 tCO2e = 1,000 kgCO2e
- 1 kgCO2e = 1,000 gCO2e

### Best Practices

1. **Use tCO2e for totals and high-level reporting** (GRI 305 compliance)
2. **Use kgCO2e for category breakdowns** (easier to read than decimals)
3. **Use gCO2e/km for intensity metrics** (more intuitive than decimal kgCO2e)
4. **Always specify the unit** in charts and tables
5. **Round appropriately**:
   - Emissions: 1 decimal place (e.g., 734.4 tCO2e)
   - Distance: No decimals for large values (e.g., 4,895,783 km)
   - Intensity: 0-1 decimal places (e.g., 150 gCO2e/km or 2.65 kgCO2e/liter)

### Current Database Structure

Our `metrics_catalog` table uses:
- **Business Travel**: Distance in `km`, emissions calculated via `kgCO2e/km` factors
- **Fleet**: Fuel in `liters` or `m³`, emissions calculated via `kgCO2e/liter` or `kgCO2e/m³` factors
- **Storage**: All emissions stored in `co2e_emissions` column as `kgCO2e`

### API Response Format

```typescript
{
  // Business Travel
  travel: [
    {
      type: 'air',
      travel_type: 'Plane Travel',
      distance_km: 4895783,
      emissions_tco2e: 734.4,
      trip_count: 45,
      intensity_gco2_per_km: 150
    }
  ],

  // Fleet
  fleet: [
    {
      type: 'diesel',
      fuel_type: 'Fleet Diesel',
      fuel_liters: 12500,
      emissions_tco2e: 33.1,
      intensity_kgco2_per_liter: 2.65,
      distance_km: 0  // Optional if tracked
    }
  ]
}
```

## References

- GHG Protocol Scope 3 Calculation Guidance (Category 6: Business Travel)
- GHG Protocol Corporate Standard
- GRI 305: Emissions 2016
- EPA Greenhouse Gas Equivalencies Calculator
