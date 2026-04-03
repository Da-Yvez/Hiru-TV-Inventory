-- ==============================================================================
-- HIRU TV INVENTORY SYSTEM - SEED DATA (SITES & DEPARTMENTS)
-- Use this to populate the initial lists from your OLD project.
-- ==============================================================================

-- 1. Create Sites
INSERT INTO public.sites (name) 
VALUES ('WTC'), ('HLS')
ON CONFLICT (name) DO NOTHING;

-- 2. Create Initial Departments for WTC
-- (Assuming we grab the first site ID for WTC)
INSERT INTO public.departments (site_id, name)
SELECT id, 'IT Department' FROM public.sites WHERE name = 'WTC'
UNION ALL
SELECT id, 'Newsroom' FROM public.sites WHERE name = 'WTC'
UNION ALL
SELECT id, 'Technical' FROM public.sites WHERE name = 'WTC'
UNION ALL
SELECT id, 'Engineering' FROM public.sites WHERE name = 'WTC'
ON CONFLICT DO NOTHING;

-- 3. Create Initial Departments for HLS
INSERT INTO public.departments (site_id, name)
SELECT id, 'Production' FROM public.sites WHERE name = 'HLS'
UNION ALL
SELECT id, 'MCR' FROM public.sites WHERE name = 'HLS'
UNION ALL
SELECT id, 'Studio' FROM public.sites WHERE name = 'HLS'
ON CONFLICT DO NOTHING;
