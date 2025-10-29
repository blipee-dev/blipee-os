-- Add Missing Columns to Existing Tables
-- This migration adds columns that the Railway worker expects but are missing from production

-- ============================================================================
-- SITES TABLE - Add Weather Service Columns
-- ============================================================================

-- Add location columns for weather tracking
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT;

-- Note: 'address' already exists as JSONB in production
-- The new latitude/longitude/city/country columns are for weather API integration

-- ============================================================================
-- AGENT_TASK_RESULTS TABLE - Add Notification Columns
-- ============================================================================

-- Add notification tracking columns
ALTER TABLE agent_task_results
ADD COLUMN IF NOT EXISTS notification_importance TEXT CHECK (notification_importance IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Create index for unsent notifications
CREATE INDEX IF NOT EXISTS idx_agent_task_results_notification_unsent
  ON agent_task_results(notification_sent, notification_importance)
  WHERE notification_sent = FALSE AND notification_importance IS NOT NULL;
