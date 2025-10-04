-- Add new fields to quotations table
ALTER TABLE public.quotations
ADD COLUMN payment_terms TEXT,
ADD COLUMN customs_duty_status TEXT CHECK (customs_duty_status IN ('CIF', 'DDP')),
ADD COLUMN conditions TEXT,
ADD COLUMN delivery_terms TEXT,
ADD COLUMN delivery_details TEXT;

-- Add new fields to sales_invoices table
ALTER TABLE public.sales_invoices
ADD COLUMN customs_duty_status TEXT CHECK (customs_duty_status IN ('CIF', 'DDP')),
ADD COLUMN conditions TEXT;