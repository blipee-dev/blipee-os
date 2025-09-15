-- Month Shift Query for Sustainability Metrics
-- This shifts all data from April-October forward by one month
-- April → May, May → June, etc., leaving April empty

-- First, let's see what we're going to update (preview)
SELECT 
    id,
    period_start,
    period_end,
    EXTRACT(MONTH FROM period_start) as current_month,
    EXTRACT(MONTH FROM period_start) + 1 as new_month,
    period_start + INTERVAL '1 month' as new_period_start,
    period_end + INTERVAL '1 month' as new_period_end
FROM metrics_data
WHERE EXTRACT(MONTH FROM period_start) BETWEEN 4 AND 10  -- April (4) to October (10)
ORDER BY period_start
LIMIT 20;  -- Remove LIMIT to see all

-- Count how many records will be affected
SELECT 
    EXTRACT(YEAR FROM period_start) as year,
    EXTRACT(MONTH FROM period_start) as month,
    COUNT(*) as record_count
FROM metrics_data
WHERE EXTRACT(MONTH FROM period_start) BETWEEN 4 AND 10
GROUP BY EXTRACT(YEAR FROM period_start), EXTRACT(MONTH FROM period_start)
ORDER BY year, month;

-- IMPORTANT: Comment out the above SELECT statements and uncomment the UPDATE below to execute the shift

-- Perform the actual update (UNCOMMENT TO RUN)
/*
UPDATE metrics_data
SET 
    period_start = period_start + INTERVAL '1 month',
    period_end = period_end + INTERVAL '1 month'
WHERE EXTRACT(MONTH FROM period_start) BETWEEN 4 AND 10;
*/

-- After running the update, verify the results:
-- This shows the count by month to confirm April is empty and October has data
/*
SELECT 
    EXTRACT(YEAR FROM period_start) as year,
    EXTRACT(MONTH FROM period_start) as month,
    COUNT(*) as record_count
FROM metrics_data
GROUP BY EXTRACT(YEAR FROM period_start), EXTRACT(MONTH FROM period_start)
ORDER BY year, month;
*/