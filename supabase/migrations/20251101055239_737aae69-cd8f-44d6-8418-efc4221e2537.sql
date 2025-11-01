-- Add discount fields to quotations table
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;

-- Add discount fields to sales_invoices table
ALTER TABLE sales_invoices
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;