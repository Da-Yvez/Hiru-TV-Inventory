-- ==============================================================================
-- HIRU TV INVENTORY SYSTEM - SCHEMA V2 (HARDWARE EXPANSION)
-- Run this in the Supabase SQL Editor to add support for multiple NICs, 
-- Monitors, and Software Licenses.
-- ==============================================================================

-- 1. Network Interfaces (Multiple IPs/MACs per Device)
CREATE TABLE IF NOT EXISTS public.network_interfaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    interface_name TEXT NOT NULL, -- e.g., 'Ethernet', 'Wi-Fi'
    ip_address TEXT,
    mac_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Monitors (Multiple Monitors per Device)
CREATE TABLE IF NOT EXISTS public.monitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    serial_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Software Licenses (Multiple Software per Device)
CREATE TABLE IF NOT EXISTS public.software_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    software_name TEXT NOT NULL,
    license_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS (Optional, but recommended)
ALTER TABLE public.network_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.software_licenses ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write for now
CREATE POLICY "Allow authenticated read" ON public.network_interfaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.network_interfaces FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.monitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.monitors FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.software_licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.software_licenses FOR INSERT TO authenticated WITH CHECK (true);
