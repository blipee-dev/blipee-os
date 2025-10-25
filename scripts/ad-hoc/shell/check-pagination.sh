#!/bin/bash

# Check what data exists in metrics_data for 2025
PGPASSWORD="MG5faEtcGRvBWkn1" psql -h aws-0-eu-central-1.pooler.supabase.com -p 6543 -U postgres.yrbmmymayojycyszUnis -c "
SELECT
  period_start,
  COUNT(*) as record_count,
  COUNT(DISTINCT metric_id) as unique_metrics,
  SUM(co2e_emissions) as total_emissions
FROM metrics_data
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND period_start >= '2025-01-01'
  AND period_start < '2026-01-01'
GROUP BY period_start
ORDER BY period_start;
"
