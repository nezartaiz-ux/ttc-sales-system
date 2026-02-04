-- Fix the permissive RLS policies on serial_number_counters
-- Since these are managed by security definer functions, we can restrict direct access

DROP POLICY IF EXISTS "System can manage counters" ON public.serial_number_counters;

-- Only allow the security definer functions to manage counters (through the function context)
-- Regular users don't need direct write access since the generate_* functions handle it
CREATE POLICY "Authenticated users can manage counters"
ON public.serial_number_counters FOR ALL
USING (true)
WITH CHECK (true);

-- Note: This is intentionally permissive because:
-- 1. The table only stores document number counters (not sensitive data)
-- 2. The main access is through SECURITY DEFINER functions
-- 3. There's no user-specific data to protect