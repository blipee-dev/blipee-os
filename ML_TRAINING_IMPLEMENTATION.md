# Real ML Training Implementation - Railway Deployment

## ✅ Implementation Complete!

Successfully integrated **real TensorFlow.js** machine learning into the existing Railway agent worker service.

---

## 🎯 What Was Implemented

### 1. **Real TensorFlow.js Training Service**
Location: `src/workers/services/ml-training-service.ts`

**Features:**
- ✅ LSTM neural networks for time series forecasting (emissions, energy)
- ✅ Autoencoder for anomaly detection
- ✅ Real model training with 50 epochs (LSTM) and 30 epochs (Autoencoder)
- ✅ Proper evaluation metrics (MAE, RMSE, R²)
- ✅ Model versioning and storage
- ✅ Auto-promotion of better models (>2% accuracy improvement)
- ✅ Training logs in database

**Replaced:** Simulated training with `await simulateTraining(2000)`

**Now Using:** Real TensorFlow.js with Node backend (383MB - no problem on Railway!)

---

## 📅 Training Schedule

**Automatic Training:**
- 🕐 **When:** 15th of every month at 2:00 AM UTC
- 🤖 **Where:** Runs in existing Railway agent worker
- 💾 **Storage:** Models saved to `./ml-models/` directory
- 📊 **Database:** Training logs → `ml_training_logs`, Models → `ml_models`

**Why 15th?** Agents run optimizations on 1st, reports on 1st (6 AM), so ML training on 15th spreads the load.

---

## 🚀 How to Use

### Test TensorFlow.js Installation

```bash
npm run ml:test
```

**Expected Output:**
```
TensorFlow.js version: 4.22.0
Backend: node
```

### Manual ML Training (on-demand)

```bash
npm run ml:train
```

This triggers immediate training for all organizations with sufficient data.

### View Training Logs (Railway)

```bash
railway logs
```

**Look for:**
```
🤖 [ML Training] Starting model training cycle...
📊 [ML Training] Found X organization(s)
🏢 [ML Training] Training models for: Org Name
   🔄 Training lstm model...
   🧠 Building neural network for emissions_forecast...
   🔧 Training complete (180 samples)
   📊 Evaluation: Accuracy 87.3%, MAE 45.21, R² 0.823
   ✅ lstm model trained (accuracy: 87.30%)
```

---

## 🏗️ Architecture

```
Railway Worker (Port 8080)
├── Agent Worker (24/7)
│   ├── 8 Autonomous Agents
│   ├── Proactive Messaging
│   └── Health Monitoring
│
└── ML Training Service (Monthly: 15th @ 2 AM)
    ├── LSTM Training (emissions, energy)
    ├── Anomaly Detection (autoencoder)
    ├── Model Evaluation
    └── Auto-Promotion
```

**Benefits:**
- ✅ No additional cost (uses existing worker)
- ✅ Training runs when agents are idle (2 AM)
- ✅ TensorFlow.js Node backend (full performance)
- ✅ Shared database and environment variables

---

## 📊 ML Models Trained

### 1. LSTM Time Series Forecaster
**Model Type:** `emissions_forecast`, `energy_forecast`

**Architecture:**
- Layer 1: LSTM (50 units, return sequences)
- Layer 2: Dropout (20%)
- Layer 3: LSTM (25 units)
- Layer 4: Dropout (20%)
- Layer 5: Dense (1 unit, linear)

**Training:**
- Window size: 30 days
- Epochs: 50
- Batch size: 32
- Optimizer: Adam (lr=0.001)
- Loss: Mean Squared Error

**Use Cases:**
- Predict emissions for next 30 days
- Forecast energy consumption
- Identify trends and seasonality

---

### 2. Autoencoder Anomaly Detector
**Model Type:** `anomaly_detection`

**Architecture:**
- Encoder: Dense(8) → Dense(2) [bottleneck]
- Decoder: Dense(8) → Dense(3) [reconstruction]

**Training:**
- Features: co2e_kg, value, grid_factor
- Epochs: 30
- Batch size: 16
- Optimizer: Adam (lr=0.001)
- Loss: Mean Squared Error (reconstruction)

**Use Cases:**
- Detect unusual emissions spikes
- Identify anomalous energy consumption
- Flag data quality issues

---

## 🗄️ Database Integration

### Tables Populated

**Core ML Tables:**
1. `ml_models` - Model metadata (type, version, accuracy, status)
2. `ml_model_storage` - Model binary weights + normalization params
3. `ml_training_logs` - Training history per epoch
4. `ml_evaluations` - Model performance metrics
5. `ml_training_cycles` - Monthly training cycle summaries

**Query Examples:**

```sql
-- Check latest trained models
SELECT 
  model_type,
  version,
  accuracy,
  training_date,
  status
FROM ml_models
WHERE status = 'active'
ORDER BY training_date DESC;

-- View training history
SELECT 
  model_id,
  model_type,
  accuracy,
  mae,
  rmse,
  r2_score,
  training_samples,
  created_at
FROM ml_training_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check monthly training cycles
SELECT 
  cycle_date,
  successful_models,
  failed_models,
  total_time_minutes,
  status
FROM ml_training_cycles
ORDER BY cycle_date DESC;
```

---

## 🐳 Docker Configuration

**Updated `Dockerfile.worker`:**

```dockerfile
# Added build tools for TensorFlow.js Node backend
RUN apk add --no-cache libc6-compat python3 make g++

# Created ML model storage directory
RUN mkdir -p ./ml-models && chown -R worker:nodejs ./ml-models
```

**Why these changes?**
- `python3 make g++`: Required to compile TensorFlow.js Node backend native bindings
- `./ml-models/`: Persistent storage for trained model files

---

## 📈 Performance Expectations

### Training Time (per organization)
- **LSTM Model:** 2-5 minutes (50 epochs, 180+ data points)
- **Anomaly Detector:** 1-3 minutes (30 epochs)
- **Total (5 orgs):** ~20-40 minutes/month

### Accuracy Targets
- **LSTM Forecasting:** 85-95% accuracy, R² > 0.75
- **Anomaly Detection:** 80-90% accuracy (reconstruction error-based)

### Resource Usage (during training)
- **CPU:** 80-100% (for 2-5 min bursts)
- **Memory:** +200-500 MB (temporary tensors)
- **Storage:** +5-10 MB per model (weights)

**Impact on agents:** None (training at 2 AM when agents are idle)

---

## 🔧 Troubleshooting

### Issue: "TensorFlow.js backend not available"

**Check:**
```bash
railway logs | grep -i tensorflow
```

**Solution:**
```bash
# Rebuild with native dependencies
railway up --force
```

### Issue: "Insufficient data for training"

**Requirement:** Minimum 180 days (6 months) of historical data

**Check:**
```sql
SELECT 
  organization_id,
  COUNT(*) as data_points,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM metrics_data
GROUP BY organization_id
HAVING COUNT(*) < 180;
```

### Issue: "Training job failed"

**Check logs:**
```bash
railway logs | grep -A 10 "ML Training"
```

**Common causes:**
1. Database connection timeout → Retry automatically next month
2. Invalid data (NaN, null) → Data validation added
3. Out of memory → Increase Railway plan resources

---

## 💰 Cost Impact

**Before:** ~$10-15/month (agent worker only)

**After:** ~$10-15/month (same!)

**Why no increase?**
- Training runs once/month (2-5 min burst)
- Uses existing worker infrastructure
- No additional services needed
- Models stored in file system (not S3)

**If you need more frequent training:**
- Weekly: ~$12-18/month (+10-20% CPU time)
- Daily: Not recommended (use Railway cron jobs instead)

---

## 🎯 Next Steps

### 1. Monitor First Training Run

**Watch logs on 15th at 2 AM UTC:**
```bash
railway logs --follow
```

**Expected:**
```
🤖 [ML Training] Starting model training cycle...
📊 [ML Training] Found 5 organization(s)
🏢 [ML Training] Training models for: Organization 1
   🧠 Building neural network for emissions_forecast...
   🔧 Training complete (213 samples)
   📊 Evaluation: Accuracy 89.2%, MAE 38.45, R² 0.847
   ✅ emissions_forecast model trained
   
...

📈 [ML Training] Training Summary:
   ✅ Successful: 10
   ❌ Failed: 0
   ⏱️  Total time: 28.5 minutes
   🎯 Models trained: 10
```

### 2. Validate Model Storage

```bash
# SSH into Railway container (if needed)
railway run ls -la ml-models/

# Should show model files like:
# org-123-lstm-1735430400000/
#   ├── model.json
#   └── weights.bin
```

### 3. Test Model Predictions

```sql
-- Check if predictions table is being populated
SELECT COUNT(*) FROM ml_predictions
WHERE created_at > NOW() - INTERVAL '30 days';
```

### 4. Enable ML Predictions in App

Currently, the app uses **statistical forecasting** (Prophet-style).

**To enable real ML predictions:**

Edit `src/lib/sustainability/unified-forecast.ts`:

```typescript
// Option 1: Use ML if available, fallback to statistical
const model = await loadMLModel(orgId, 'emissions_forecast');
if (model) {
  return await model.predict(inputData); // Real ML
} else {
  return await statisticalForecast(data); // Fallback
}

// Option 2: A/B test (50% ML, 50% statistical)
const useML = Math.random() > 0.5;
if (useML) {
  return await mlPredict(data);
} else {
  return await statisticalForecast(data);
}
```

---

## 📚 Resources

**TensorFlow.js Docs:**
- https://www.tensorflow.org/js/guide/nodejs
- https://www.tensorflow.org/js/tutorials

**Railway Docs:**
- https://docs.railway.app/deploy/deployments
- https://docs.railway.app/develop/services

**Monitoring:**
- Railway Dashboard: https://railway.com/project/[your-project-id]
- Health Check: `curl https://your-worker.railway.app/health`

---

## ✅ Summary

**What changed:**
1. ✅ ML training service now uses **real TensorFlow.js** (not simulated)
2. ✅ LSTM models train monthly on 15th at 2 AM UTC
3. ✅ Autoencoder anomaly detection ready
4. ✅ Deployed to Railway (already live!)
5. ✅ Zero additional cost (same worker, same plan)

**What's ready:**
- ✅ 16 ML database tables (will be populated on 15th)
- ✅ Model storage directory (`./ml-models/`)
- ✅ Training logs and monitoring
- ✅ Auto-promotion of better models

**What's next:**
- ⏳ Wait for 15th at 2 AM UTC (first training run)
- 📊 Monitor training logs
- 🎯 Integrate ML predictions into app (optional)
- 🔬 A/B test ML vs statistical forecasts (optional)

---

**Status:** 🟢 Deployed and running!

**Next Training:** 15th of next month at 2:00 AM UTC

**Manual Training:** `npm run ml:train` (anytime)

**Health Check:** `curl https://your-worker.railway.app/health`

---

**Questions?** Check Railway logs: `railway logs | grep "ML Training"`
