-- Add customs_duty_status column to purchase_orders table
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS customs_duty_status TEXT;