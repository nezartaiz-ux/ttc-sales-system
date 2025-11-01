-- Add purchase_order_id field to sales_invoices table
ALTER TABLE sales_invoices
ADD COLUMN IF NOT EXISTS purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL;