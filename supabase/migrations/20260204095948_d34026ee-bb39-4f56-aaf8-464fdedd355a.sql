-- Add discount fields to purchase_orders table
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS discount_type text,
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;

COMMENT ON COLUMN public.purchase_orders.discount_type IS 'Type of discount: percentage or fixed';
COMMENT ON COLUMN public.purchase_orders.discount_value IS 'Discount value (percentage or fixed amount)';