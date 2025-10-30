-- Add confidence interval columns to ml_predictions for Prophet forecasts
-- Prophet forecasts include lower and upper confidence bounds that need to be stored

-- Add confidence_lower column (JSONB array of lower confidence bounds)
ALTER TABLE public.ml_predictions
ADD COLUMN IF NOT EXISTS confidence_lower JSONB DEFAULT '[]'::jsonb;

-- Add confidence_upper column (JSONB array of upper confidence bounds)
ALTER TABLE public.ml_predictions
ADD COLUMN IF NOT EXISTS confidence_upper JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.ml_predictions.confidence_lower IS 'Lower confidence interval bounds for forecast predictions (JSONB array)';
COMMENT ON COLUMN public.ml_predictions.confidence_upper IS 'Upper confidence interval bounds for forecast predictions (JSONB array)';
