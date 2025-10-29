# ML Training Testing Guide

Quick guide to test TensorFlow.js ML training locally before the scheduled monthly run.

---

## 🧪 Local Testing

### 1. Test TensorFlow.js Installation

```bash
npm run ml:test
```

**Expected Output:**
```
TensorFlow.js version: 4.22.0
Backend: node
```

If you see an error, install TensorFlow.js:
```bash
npm install @tensorflow/tfjs-node
```

---

### 2. Create Test Data (if needed)

If your database doesn't have enough data (need 180+ days), seed test data:

```sql
-- Insert 6 months of test metrics data
INSERT INTO metrics_data (
  organization_id,
  site_id,
  category,
  metric_key,
  date,
  value,
  co2e_kg,
  grid_factor
)
SELECT
  'your-org-id',
  'your-site-id',
  'energy',
  'electricity_grid',
  date::date,
  100 + random() * 50, -- Random value between 100-150
  50 + random() * 25,  -- Random CO2e between 50-75
  0.5 + random() * 0.2  -- Random grid factor
FROM generate_series(
  NOW() - INTERVAL '180 days',
  NOW(),
  INTERVAL '1 day'
) date;
```

---

### 3. Run Manual Training

```bash
npm run ml:train
```

**What happens:**
1. Connects to Supabase
2. Fetches organizations
3. Loads 6 months of historical data
4. Trains LSTM model (emissions forecast)
5. Trains Autoencoder (anomaly detection)
6. Evaluates models
7. Stores in database

**Expected Console Output:**

```
🤖 [ML Training] Starting model training cycle...
📊 [ML Training] Found 1 organization(s)
🏢 [ML Training] Training models for: Your Org

   Training: emissions_forecast for org your-org-id
   🧠 Building neural network for emissions_forecast...
   🔧 Training complete (180 samples)
   📊 Evaluation: Accuracy 87.3%, MAE 45.21, R² 0.823
   ✅ emissions_forecast model trained (accuracy: 87.30%)

   Training: anomaly_detection for org your-org-id
   🧠 Building neural network for anomaly_detection...
   🔍 Training anomaly detection autoencoder...
   🔧 Training complete (180 samples)
   📊 Evaluation: Accuracy 82.1%, MAE 0.089, R² 0.850
   ✅ anomaly_detection model trained (accuracy: 82.10%)

✅ [ML Training] Completed in 3.45 minutes
   • Models trained: 2
   • Models promoted: 2
   • Avg accuracy improvement: 5.20%
```

---

### 4. Verify Model Storage

Check if models were saved:

```bash
ls -R ml-models/
```

**Expected:**
```
ml-models/your-org-id-lstm-1735430400000/
  model.json
  weights.bin

ml-models/your-org-id-anomaly-1735430400000/
  model.json
  weights.bin
```

---

### 5. Verify Database Records

```sql
-- Check ml_models table
SELECT 
  model_type,
  version,
  accuracy,
  status,
  training_date
FROM ml_models
ORDER BY training_date DESC;

-- Check ml_training_logs
SELECT 
  model_type,
  accuracy,
  mae,
  rmse,
  r2_score,
  training_samples,
  created_at
FROM ml_training_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check ml_training_cycles
SELECT 
  cycle_date,
  successful_models,
  failed_models,
  total_time_minutes
FROM ml_training_cycles
ORDER BY cycle_date DESC
LIMIT 1;
```

---

## 🐛 Common Errors

### Error: "No organizations found"

**Solution:** Make sure you have at least one organization in the database:

```sql
SELECT id, name FROM organizations;
```

---

### Error: "Insufficient data for sequence creation"

**Cause:** Not enough historical data (need 180+ days)

**Solution:** 
1. Use the test data SQL from step 2 above
2. Or wait until you have real historical data

---

### Error: "TensorFlow backend not available"

**Solution:**
```bash
# Reinstall TensorFlow.js with Node backend
npm uninstall @tensorflow/tfjs-node
npm install @tensorflow/tfjs-node --build-from-source
```

---

### Error: "EACCES: permission denied, mkdir './ml-models'"

**Solution:**
```bash
mkdir -p ml-models
chmod 755 ml-models
```

---

## 🚀 Test on Railway (before scheduled run)

If you want to test on Railway before waiting for the 15th:

```bash
# SSH into Railway container
railway run bash

# Run training manually
npm run ml:train

# Exit
exit
```

Or trigger via Railway API:

```bash
# Create one-off job
railway run npm run ml:train
```

---

## 📊 Performance Benchmarks

**Expected training times:**

| Dataset Size | LSTM Training | Autoencoder | Total |
|-------------|--------------|-------------|-------|
| 180 days | 2-3 min | 1-2 min | 3-5 min |
| 365 days | 4-6 min | 2-3 min | 6-9 min |
| 730 days | 8-12 min | 4-6 min | 12-18 min |

**Memory usage:**
- Base: ~200 MB
- During training: +300-500 MB (temporary tensors)
- Model storage: ~5-10 MB per model

---

## ✅ Success Checklist

Before the 15th (scheduled run), verify:

- [ ] TensorFlow.js installed (`npm run ml:test` works)
- [ ] At least 180 days of metrics data
- [ ] Organizations exist in database
- [ ] `ml_models` table exists
- [ ] `ml-models/` directory writable
- [ ] Environment variables set (Supabase URL, service key)
- [ ] Manual training works (`npm run ml:train`)
- [ ] Models appear in database after training
- [ ] Model files saved to `ml-models/` directory

---

## 🎯 Next Steps After Testing

1. ✅ **Verified local training works** → Ready for scheduled run
2. 📅 **Wait for 15th at 2 AM UTC** → Automatic training
3. 📊 **Monitor first run** → `railway logs`
4. 🔍 **Check database** → Verify models were saved
5. 🚀 **Integrate predictions** → Update app to use ML models (optional)

---

**Ready to go!** 🎉

The ML training will run automatically on the 15th, or you can trigger manually anytime with `npm run ml:train`.
