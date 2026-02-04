-- Update user_roles policy for proper management
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (true);

-- Create update_user_roles function with array input
CREATE OR REPLACE FUNCTION public.update_user_roles(
  target_user_id UUID,
  new_roles user_role[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Delete existing roles for the user
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Insert new roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT target_user_id, unnest(new_roles);
END;
$$;

-- Add purchase_order_id field to sales_invoices table
ALTER TABLE public.sales_invoices
ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL;

-- Add customs_duty_status to sales_invoices if not exists
ALTER TABLE public.sales_invoices
ADD COLUMN IF NOT EXISTS customs_duty_status TEXT;

-- Create serial_number_counters table
CREATE TABLE IF NOT EXISTS public.serial_number_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(document_type, month, year)
);

-- Enable RLS on serial_number_counters
ALTER TABLE public.serial_number_counters ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view counters
CREATE POLICY "Authenticated users can view counters"
  ON public.serial_number_counters FOR SELECT
  USING (true);

-- Policy for system to manage counters
CREATE POLICY "System can manage counters"
  ON public.serial_number_counters FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated function for quotation numbers: Quot-0001-11-25
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000;
  
  INSERT INTO serial_number_counters (document_type, month, year, counter)
  VALUES ('quotation', current_month, current_year, 1)
  ON CONFLICT (document_type, month, year) 
  DO UPDATE SET counter = serial_number_counters.counter + 1, updated_at = now()
  RETURNING counter INTO next_num;
  
  formatted_num := 'Quot-' || LPAD(next_num::TEXT, 4, '0') || '-' || 
                   LPAD(current_month::TEXT, 2, '0') || '-' || 
                   LPAD(current_year::TEXT, 2, '0');
  RETURN formatted_num;
END;
$function$;

-- Updated function for PO numbers: SPO-0001-11-25
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000;
  
  INSERT INTO serial_number_counters (document_type, month, year, counter)
  VALUES ('purchase_order', current_month, current_year, 1)
  ON CONFLICT (document_type, month, year) 
  DO UPDATE SET counter = serial_number_counters.counter + 1, updated_at = now()
  RETURNING counter INTO next_num;
  
  formatted_num := 'SPO-' || LPAD(next_num::TEXT, 4, '0') || '-' || 
                   LPAD(current_month::TEXT, 2, '0') || '-' || 
                   LPAD(current_year::TEXT, 2, '0');
  RETURN formatted_num;
END;
$function$;

-- Updated function for invoice numbers: SIN-0001-11-25
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000;
  
  INSERT INTO serial_number_counters (document_type, month, year, counter)
  VALUES ('sales_invoice', current_month, current_year, 1)
  ON CONFLICT (document_type, month, year) 
  DO UPDATE SET counter = serial_number_counters.counter + 1, updated_at = now()
  RETURNING counter INTO next_num;
  
  formatted_num := 'SIN-' || LPAD(next_num::TEXT, 4, '0') || '-' || 
                   LPAD(current_month::TEXT, 2, '0') || '-' || 
                   LPAD(current_year::TEXT, 2, '0');
  RETURN formatted_num;
END;
$function$;

-- Updated function for delivery note numbers: DN-0001-11-25
CREATE OR REPLACE FUNCTION public.generate_delivery_note_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000;
  
  INSERT INTO serial_number_counters (document_type, month, year, counter)
  VALUES ('delivery_note', current_month, current_year, 1)
  ON CONFLICT (document_type, month, year) 
  DO UPDATE SET counter = serial_number_counters.counter + 1, updated_at = now()
  RETURNING counter INTO next_num;
  
  formatted_num := 'DN-' || LPAD(next_num::TEXT, 4, '0') || '-' || 
                   LPAD(current_month::TEXT, 2, '0') || '-' || 
                   LPAD(current_year::TEXT, 2, '0');
  RETURN formatted_num;
END;
$function$;