-- Tighten quotations SELECT
DROP POLICY IF EXISTS "All authenticated users can view quotations" ON public.quotations;
CREATE POLICY "Authorized users can view quotations"
ON public.quotations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'quotations'::text, 'view'::text)
);

-- Tighten quotation_items SELECT
DROP POLICY IF EXISTS "All authenticated users can view quotation items" ON public.quotation_items;
CREATE POLICY "Authorized users can view quotation items"
ON public.quotation_items
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'quotations'::text, 'view'::text)
);

-- Restrict serial_number_counters to authenticated users only (was public)
DROP POLICY IF EXISTS "Authenticated users can manage counters" ON public.serial_number_counters;
DROP POLICY IF EXISTS "Authenticated users can view counters" ON public.serial_number_counters;

CREATE POLICY "Authenticated users can view counters"
ON public.serial_number_counters
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert counters"
ON public.serial_number_counters
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update counters"
ON public.serial_number_counters
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
