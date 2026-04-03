-- ==============================================================================
-- DEVICE TYPES & DYNAMIC SPECS (admin-configurable inventory taxonomy)
-- Run in Supabase SQL Editor after main schema.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_device_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_pc BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.inventory_device_type_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_type_id UUID NOT NULL REFERENCES public.inventory_device_types(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    field_kind TEXT NOT NULL DEFAULT 'text' CHECK (field_kind IN ('text', 'textarea', 'number', 'select')),
    required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    select_options JSONB NOT NULL DEFAULT '[]',
    UNIQUE (device_type_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_inventory_device_type_fields_type
    ON public.inventory_device_type_fields(device_type_id);

ALTER TABLE public.devices
    ADD COLUMN IF NOT EXISTS device_type_id UUID REFERENCES public.inventory_device_types(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS spec_values JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.devices
    ALTER COLUMN spec_values SET DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.inventory_device_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_device_type_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_device_types authenticated read" ON public.inventory_device_types;
CREATE POLICY "inventory_device_types authenticated read"
    ON public.inventory_device_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inventory_device_types admin manage" ON public.inventory_device_types;
CREATE POLICY "inventory_device_types admin manage"
    ON public.inventory_device_types FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

DROP POLICY IF EXISTS "inventory_device_type_fields authenticated read" ON public.inventory_device_type_fields;
CREATE POLICY "inventory_device_type_fields authenticated read"
    ON public.inventory_device_type_fields FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "inventory_device_type_fields admin manage" ON public.inventory_device_type_fields;
CREATE POLICY "inventory_device_type_fields admin manage"
    ON public.inventory_device_type_fields FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
    );

-- ---------------------------------------------------------------------------
-- Seed: PC (fields map to devices.cpu, gpu, ram, storage) + broadcast gear examples
-- ---------------------------------------------------------------------------
INSERT INTO public.inventory_device_types (slug, name, description, is_pc, sort_order)
VALUES
    ('pc', 'Desktop / Laptop PC', 'Workstations with CPU, RAM, storage, monitors, NICs.', true, 0),
    ('camera', 'Camera', 'Broadcast / ENG cameras.', false, 10),
    ('microphone', 'Microphone', 'Wired and wireless mics.', false, 20),
    ('tripod', 'Tripod / Support', 'Stands, tripods, mounting.', false, 30),
    ('cable', 'Cable / Adapter', 'SDI, XLR, power, adapters.', false, 40),
    ('battery', 'Battery / Power', 'Batteries, chargers, UPS gear.', false, 50)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.inventory_device_type_fields (device_type_id, field_key, label, field_kind, required, sort_order, select_options)
SELECT t.id, v.field_key, v.label, v.field_kind, v.required, v.sort_order, v.select_options::jsonb
FROM public.inventory_device_types t
CROSS JOIN (VALUES
    ('pc', 'cpu', 'Processor (CPU)', 'text', true, 0, '[]'),
    ('pc', 'gpu', 'Graphics (GPU)', 'text', false, 1, '[]'),
    ('pc', 'ram', 'Memory (RAM)', 'text', true, 2, '[]'),
    ('pc', 'storage', 'Storage', 'text', true, 3, '[]'),
    ('camera', 'sensor_size', 'Sensor / format', 'text', false, 0, '[]'),
    ('camera', 'lens_mount', 'Lens mount', 'text', false, 1, '[]'),
    ('camera', 'recording_format', 'Recording formats', 'text', false, 2, '[]'),
    ('microphone', 'polar_pattern', 'Polar pattern', 'select', false, 0, '["Cardioid", "Omni", "Shotgun", "Other"]'),
    ('microphone', 'connector', 'Connector', 'text', true, 1, '[]'),
    ('tripod', 'max_height_cm', 'Max height (cm)', 'number', false, 0, '[]'),
    ('tripod', 'payload_kg', 'Rated payload (kg)', 'number', false, 1, '[]'),
    ('cable', 'cable_length_m', 'Length (m)', 'text', false, 0, '[]'),
    ('cable', 'signal_type', 'Signal type', 'select', false, 1, '["SDI", "HDMI", "XLR", "Power", "Ethernet", "Other"]'),
    ('battery', 'capacity_wh', 'Capacity (Wh)', 'text', false, 0, '[]'),
    ('battery', 'cell_chemistry', 'Chemistry', 'text', false, 1, '[]')
) AS v(type_slug, field_key, label, field_kind, required, sort_order, select_options)
WHERE t.slug = v.type_slug
ON CONFLICT (device_type_id, field_key) DO NOTHING;

-- Attach existing devices to PC type when possible
UPDATE public.devices d
SET device_type_id = t.id
FROM public.inventory_device_types t
WHERE t.slug = 'pc' AND d.device_type_id IS NULL;
