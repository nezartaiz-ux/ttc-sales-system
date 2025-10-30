-- Add foreign key constraints to link created_by columns to profiles
ALTER TABLE public.quotations
ADD CONSTRAINT quotations_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.purchase_orders
ADD CONSTRAINT purchase_orders_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.sales_invoices
ADD CONSTRAINT sales_invoices_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE CASCADE;