# Unit Conversion Flow - Correct Implementation

## Data Flow Summary

```
Database (kg) → API fetches (kg) → Model converts (kg→tons) → Predictions (tons) → Frontend (tons)
```

## Detailed Flow

### 1. Database Storage
- **Unit**: Kilograms (kg)
- **Table**: `metrics_data.co2e_emissions`
- **Example**: 29502 kg

### 2. Emissions API (`/api/sustainability/emissions`)
- **Input**: Fetches from database in kg
- **Processing**: Converts kg to tons (÷1000)
- **Output**: Returns tons to frontend
- **Example**: 29502 kg → 29.5 tons

### 3. ML Prediction API (`/api/ml/predict`)
- **Input**: Fetches from database in kg
- **Processing**:
  - Passes data to model in kg (NO conversion here)
  - Model returns predictions in tons
  - NO additional conversion needed
- **Output**: Returns predictions in tons
- **Example**: Input 29502 kg → Model converts internally → Output 28.5 tons

### 4. EmissionsForecastModel
- **Input**: Receives data in kg from API
- **Processing**:
  - Converts kg to tons internally (÷1000) before passing to ensemble
  - Advanced forecast engine works with tons
  - Returns predictions in tons
- **Output**: Predictions in tons

### 5. Frontend Display
- **Input**: Receives tons from both APIs
- **Processing**: Direct display (may format as "28.5" or "28.5k" for thousands)
- **Output**: Shows tons with "tCO2e" unit

## Common Mistakes to Avoid

❌ **DON'T** convert in ML Prediction API route after model returns
❌ **DON'T** convert twice (both in API and model)
❌ **DON'T** mix units without clear documentation

## Validation Checks

1. Database value: ~29500 kg
2. Emissions API current: ~29.5 tons
3. ML predictions: ~25-35 tons (reasonable range)
4. Frontend display: ~29.5 tCO2e current, ~28 tCO2e predicted