-- Drop existing sequences
DROP SEQUENCE IF EXISTS quotation_number_seq CASCADE;
DROP SEQUENCE IF EXISTS purchase_order_number_seq CASCADE;
DROP SEQUENCE IF EXISTS invoice_number_seq CASCADE;

-- Create new table to track serial numbers by month
CREATE TABLE IF NOT EXISTS serial_number_counters (
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
ALTER TABLE serial_number_counters ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view counters
CREATE POLICY "Authenticated users can view counters"
  ON serial_number_counters FOR SELECT
  USING (true);

-- Policy for system to manage counters
CREATE POLICY "System can manage counters"
  ON serial_number_counters FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated function for quotation numbers: Quot-0001-11-25
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000; -- Get last 2 digits
  
  -- Get or create counter for current month
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