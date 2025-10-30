-- Make model_id nullable in ml_predictions for Prophet forecasts
-- Prophet is a forecasting service, not a trained ML model
-- Therefore Prophet predictions don't have an associated model_id

ALTER TABLE public.ml_predictions
ALTER COLUMN model_id DROP NOT NULL;

COMMENT ON COLUMN public.ml_predictions.model_id IS 'Optional model ID. NULL for external forecasting services like Prophet that do not store models in ml_models table.';
