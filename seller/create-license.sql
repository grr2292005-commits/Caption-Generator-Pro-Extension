-- ================================================================
-- CAPTION GENERATOR PRO - SELLER LICENSE MANAGEMENT TEMPLATES
-- Run these queries inside your Supabase Dashboard SQL Editor
-- ================================================================

-- 1. Create a 1-Machine License Key
INSERT INTO public.licenses (license_key, max_activations, is_active, notes)
VALUES ('CGP-1001-A1B2-C3D4', 1, true, 'Customer: buyer@example.com - Single License');


-- 2. Create a 2-Machine License Key (Dual Workstation / Laptop + PC)
INSERT INTO public.licenses (license_key, max_activations, is_active, notes)
VALUES ('CGP-2002-X9Y8-Z7W6', 2, true, 'Customer: studio@example.com - Dual License');


-- 3. Disable / Revoke a License Key
UPDATE public.licenses
SET is_active = false, notes = notes || ' [REVOKED: ' || NOW()::text || ']'
WHERE license_key = 'CGP-1001-A1B2-C3D4';


-- 4. Check Activations & Machine IDs for a Specific License Key
SELECT 
    l.license_key,
    l.max_activations,
    l.is_active,
    a.id AS activation_id,
    a.machine_id,
    a.created_at AS activated_at
FROM public.licenses l
LEFT JOIN public.activations a ON l.id = a.license_id
WHERE l.license_key = 'CGP-1001-A1B2-C3D4';


-- 5. List Recent Licenses with Current Activation Counts
SELECT 
    l.id,
    l.license_key,
    l.max_activations,
    COUNT(a.id) AS current_activations,
    l.is_active,
    l.notes,
    l.created_at
FROM public.licenses l
LEFT JOIN public.activations a ON l.id = a.license_id
GROUP BY l.id, l.license_key, l.max_activations, l.is_active, l.notes, l.created_at
ORDER BY l.created_at DESC
LIMIT 20;


-- 6. Reset / Remove Activations for a Customer (PC Transfer / Hardware Reset)
DELETE FROM public.activations
WHERE license_id = (SELECT id FROM public.licenses WHERE license_key = 'CGP-1001-A1B2-C3D4');
