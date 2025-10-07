-- Fix baseline_year constraint to allow current and future years
-- The original constraint only allowed 2015-2023, but we need to support 2024+

-- Drop the old constraint
ALTER TABLE sustainability_targets
DROP CONSTRAINT IF EXISTS sustainability_targets_baseline_year_check;

-- Add new constraint that allows years from 2015 onwards (no upper limit)
ALTER TABLE sustainability_targets
ADD CONSTRAINT sustainability_targets_baseline_year_check
CHECK (baseline_year >= 2015 AND baseline_year <= EXTRACT(YEAR FROM CURRENT_DATE));

-- Also update target_year constraint to be more flexible
ALTER TABLE sustainability_targets
DROP CONSTRAINT IF EXISTS sustainability_targets_target_year_check;

ALTER TABLE sustainability_targets
ADD CONSTRAINT sustainability_targets_target_year_check
CHECK (target_year >= 2025 AND target_year <= 2100);

COMMENT ON CONSTRAINT sustainability_targets_baseline_year_check ON sustainability_targets IS
'Baseline year must be between 2015 and current year';

COMMENT ON CONSTRAINT sustainability_targets_target_year_check ON sustainability_targets IS
'Target year must be between 2025 and 2100 (allows long-term net-zero targets)';
