-- ==============================================================================
-- HIRU TV INVENTORY SYSTEM - SUPABASE DATABASE SCHEMA
-- Execute this script in the Supabase SQL Editor.
-- ==============================================================================

-- 1. ENUMS (Custom Data Types)
CREATE TYPE device_status_enum AS ENUM ('ACTIVE', 'FAILED', 'REPLACED');
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'TECHNICIAN');
CREATE TYPE transaction_type_enum AS ENUM ('IN', 'OUT');

-- 2. USERS Extension (Binds to Supabase Auth)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'TECHNICIAN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DEPARTMENTS & SITES
CREATE TABLE public.sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DEVICES (Main Inventory)
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pc_number TEXT UNIQUE NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT,
    
    cpu TEXT NOT NULL,
    gpu TEXT,
    ram TEXT NOT NULL,
    storage TEXT NOT NULL,
    
    status device_status_enum NOT NULL DEFAULT 'ACTIVE',
    department_id UUID REFERENCES public.departments(id),
    assigned_user TEXT,
    
    added_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. GENERAL STOCK (Peripherals, Components)
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_name TEXT NOT NULL,
    category TEXT NOT NULL,
    reorder_threshold INTEGER DEFAULT 5 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. STOCK TRANSACTIONS (In/Out Ledger)
CREATE TABLE public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transaction_type transaction_type_enum NOT NULL,
    notes TEXT,
    user_id UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ACTIVITY LOGS (Immutable History Ledger)
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id),
    action_type TEXT NOT NULL, -- e.g., 'DEVICE_ADD', 'STOCK_OUT', 'STATUS_CHANGE'
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TRIGGERS (Automations)
-- Automatically update the updated_at timestamp on the devices table
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_modtime 
BEFORE UPDATE ON public.devices 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();


-- ==============================================================================
-- INITIAL DEFAULT DATA
-- ==============================================================================
INSERT INTO public.sites (name) VALUES ('Hiru TV Head Office'), ('WTC Branch');

-- Note: We do not insert Users manually here because they must be created via Supabase Auth first,
-- triggering a webhook or function that syncs them to public.user_profiles.
