-- Fix agent_alerts table schema
-- Add missing columns that are causing real-time monitoring issues

-- Add missing columns to agent_alerts table
ALTER TABLE public.agent_alerts
ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;

-- Create device_telemetry table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.device_telemetry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  consumption DECIMAL(10,2),
  emissions DECIMAL(10,2),
  efficiency DECIMAL(5,4),
  status TEXT DEFAULT 'operational',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on device_telemetry
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for device_telemetry
DROP POLICY IF EXISTS "Users can access telemetry for their organization" ON public.device_telemetry;
CREATE POLICY "Users can access telemetry for their organization" ON public.device_telemetry
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for device_telemetry
CREATE INDEX IF NOT EXISTS idx_device_telemetry_org_id ON public.device_telemetry(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_device_id ON public.device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_timestamp ON public.device_telemetry(timestamp);

-- Update agent_alerts RLS policies to handle new columns
DROP POLICY IF EXISTS "Users can view alerts for their organization" ON public.agent_alerts;
DROP POLICY IF EXISTS "Users can insert alerts for their organization" ON public.agent_alerts;
DROP POLICY IF EXISTS "Users can update alerts for their organization" ON public.agent_alerts;

CREATE POLICY "Users can view alerts for their organization" ON public.agent_alerts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert alerts for their organization" ON public.agent_alerts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alerts for their organization" ON public.agent_alerts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_alerts_alert_type ON public.agent_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_acknowledged ON public.agent_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_agent_alerts_resolved ON public.agent_alerts(resolved);