ALTER TABLE public.quotations
ADD CONSTRAINT quotations_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.purchase_orders
ADD CONSTRAINT purchase_orders_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.delivery_notes
ADD CONSTRAINT delivery_notes_created_by_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;