-- Insert the three main categories
INSERT INTO public.product_categories (name, description, is_active) 
VALUES 
  ('Electric Generators', 'Power generation equipment and generators', true),
  ('Heavy Equipment', 'Heavy machinery and construction equipment', true),
  ('Agricultural Plows', 'Agricultural machinery and plowing equipment', true)
ON CONFLICT DO NOTHING;

-- Create sequences for document numbering
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS purchase_order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Create function to generate quotation number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  next_num := nextval('quotation_number_seq');
  formatted_num := 'QUO-' || LPAD(next_num::TEXT, 4, '0');
  RETURN formatted_num;
END;
$$;

-- Create function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  next_num := nextval('purchase_order_number_seq');
  formatted_num := 'PO-' || LPAD(next_num::TEXT, 4, '0');
  RETURN formatted_num;
END;
$$;

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  next_num := nextval('invoice_number_seq');
  formatted_num := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  RETURN formatted_num;
END;
$$;