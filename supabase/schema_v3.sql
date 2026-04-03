-- ==============================================================================
-- HIRU TV INVENTORY SYSTEM - SCHEMA V3 (SIMPLIFICATION)
-- Removing Site-dependency from Departments as requested.
-- ==============================================================================

-- 1. Make site_id optional or remove it from departments
ALTER TABLE public.departments DROP COLUMN IF EXISTS site_id;

-- 2. Ensure RLS is still correct
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read" ON public.departments;
DROP POLICY IF EXISTS "Allow admins to manage" ON public.departments;

CREATE POLICY "Allow authenticated read" ON public.departments 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage" ON public.departments 
    FOR ALL TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'ADMIN'));
