-- Fix the ip_address column to handle null/invalid IPs gracefully
ALTER TABLE audit_events 
DROP COLUMN IF EXISTS ip_address;

ALTER TABLE audit_events 
ADD COLUMN ip_address INET GENERATED ALWAYS AS (
  CASE
    WHEN event->'context'->>'ip' IS NULL THEN NULL
    WHEN event->'context'->>'ip' = '' THEN NULL
    WHEN event->'context'->>'ip' = 'localhost' THEN '127.0.0.1'::inet
    ELSE (event->'context'->>'ip')::inet
  END
) STORED;