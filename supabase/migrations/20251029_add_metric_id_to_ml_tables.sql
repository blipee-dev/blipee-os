-- Add metric_id to ML tables for metric-specific model training
-- This aligns ML training with Prophet forecasting approach

-- 1. Add metric_id to ml_models table
ALTER TABLE ml_models
ADD COLUMN metric_id UUID REFERENCES metrics_catalog(id) ON DELETE CASCADE;

-- 2. Add metric_id to ml_model_storage table
ALTER TABLE ml_model_storage
ADD COLUMN metric_id UUID REFERENCES metrics_catalog(id) ON DELETE CASCADE;

-- 3. Create index for efficient metric-based queries
CREATE INDEX idx_ml_models_metric ON ml_models(metric_id);
CREATE INDEX idx_ml_storage_metric ON ml_model_storage(metric_id);

-- 4. Update unique constraint on ml_model_storage to include metric_id
-- Drop old constraint
ALTER TABLE ml_model_storage
DROP CONSTRAINT ml_model_storage_organization_id_model_type_key;

-- Add new constraint with metric_id
ALTER TABLE ml_model_storage
ADD CONSTRAINT ml_model_storage_org_type_metric_key
UNIQUE (organization_id, model_type, metric_id);

-- 5. Update unique constraint on ml_models to include metric_id
-- Drop old constraint
ALTER TABLE ml_models
DROP CONSTRAINT ml_models_organization_id_model_type_version_key;

-- Add new constraint with metric_id
ALTER TABLE ml_models
ADD CONSTRAINT ml_models_org_type_metric_version_key
UNIQUE (organization_id, model_type, metric_id, version);

COMMENT ON COLUMN ml_models.metric_id IS 'Links model to specific metric from metrics_catalog - enables metric-specific LSTM/Autoencoder training';
COMMENT ON COLUMN ml_model_storage.metric_id IS 'Links stored model to specific metric - enables metric-specific predictions';
