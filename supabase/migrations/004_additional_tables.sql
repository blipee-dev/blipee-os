-- Monitoring preferences table
CREATE TABLE IF NOT EXISTS public.monitoring_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    priorities JSONB DEFAULT '[]'::jsonb,
    metrics TEXT[] DEFAULT '{}',
    alert_thresholds JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(building_id, user_id)
);

-- Pending assignments for invited users
CREATE TABLE IF NOT EXISTS public.pending_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- Work orders table for technicians
CREATE TABLE IF NOT EXISTS public.work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.user_profiles(id),
    created_by UUID NOT NULL REFERENCES public.user_profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    category VARCHAR(50),
    area VARCHAR(255),
    equipment_id UUID,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Equipment registry
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    installation_date DATE,
    warranty_expires DATE,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'operational',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitoring_prefs_building ON monitoring_preferences(building_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_prefs_user ON monitoring_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_assignments_email ON pending_assignments(email);
CREATE INDEX IF NOT EXISTS idx_work_orders_building ON work_orders(building_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_equipment_building ON equipment(building_id);

-- RLS Policies
ALTER TABLE monitoring_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Monitoring preferences policies
CREATE POLICY "Users can view their own monitoring preferences"
    ON monitoring_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitoring preferences"
    ON monitoring_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Site managers can create monitoring preferences"
    ON monitoring_preferences FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN buildings b ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
            AND b.id = building_id
            AND om.role IN ('site_manager', 'organization_admin', 'subscription_owner')
        )
    );

-- Work orders policies
CREATE POLICY "Users can view work orders for their buildings"
    ON work_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM building_assignments ba
            WHERE ba.user_id = auth.uid()
            AND ba.building_id = work_orders.building_id
        )
        OR
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN buildings b ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
            AND b.id = work_orders.building_id
        )
    );

CREATE POLICY "Authorized users can create work orders"
    ON work_orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM building_assignments ba
            WHERE ba.user_id = auth.uid()
            AND ba.building_id = building_id
        )
        OR
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN buildings b ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
            AND b.id = building_id
        )
    );

CREATE POLICY "Assigned users can update work orders"
    ON work_orders FOR UPDATE
    USING (
        assigned_to = auth.uid()
        OR created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM organization_members om
            JOIN buildings b ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
            AND b.id = work_orders.building_id
            AND om.role IN ('site_manager', 'facility_manager', 'organization_admin', 'subscription_owner')
        )
    );

-- Equipment policies
CREATE POLICY "Users can view equipment for their buildings"
    ON equipment FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM building_assignments ba
            WHERE ba.user_id = auth.uid()
            AND ba.building_id = equipment.building_id
        )
        OR
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN buildings b ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
            AND b.id = equipment.building_id
        )
    );

CREATE POLICY "Managers can manage equipment"
    ON equipment FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om
            JOIN buildings b ON b.organization_id = om.organization_id
            WHERE om.user_id = auth.uid()
            AND b.id = equipment.building_id
            AND om.role IN ('site_manager', 'facility_manager', 'organization_admin', 'subscription_owner')
        )
    );