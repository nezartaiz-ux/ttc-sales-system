-- Create delivery_note_status enum
CREATE TYPE public.delivery_note_status AS ENUM ('draft', 'sent', 'delivered', 'cancelled');

-- Create delivery notes table
CREATE TABLE public.delivery_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_note_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  sales_invoice_id UUID REFERENCES public.sales_invoices(id),
  delivery_date DATE,
  driver_name TEXT,
  vehicle_number TEXT,
  status delivery_note_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery note items table
CREATE TABLE public.delivery_note_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_note_id UUID NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  model TEXT,
  description TEXT,
  quantity INTEGER NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user permissions table
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module, action)
);

-- Create technical datasheets table
CREATE TABLE public.technical_datasheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create item images table
CREATE TABLE public.item_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_category_assignments table
CREATE TABLE public.user_category_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_datasheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_notes
CREATE POLICY "All authenticated users can view delivery notes" ON public.delivery_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff and admins can manage delivery notes" ON public.delivery_notes FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales_staff')
);

-- RLS Policies for delivery_note_items
CREATE POLICY "All authenticated users can view delivery note items" ON public.delivery_note_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff and admins can manage delivery note items" ON public.delivery_note_items FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sales_staff')
);

-- RLS Policies for user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all permissions" ON public.user_permissions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage permissions" ON public.user_permissions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for technical_datasheets
CREATE POLICY "All authenticated users can view datasheets" ON public.technical_datasheets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage datasheets" ON public.technical_datasheets FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inventory_staff')
);

-- RLS Policies for item_images
CREATE POLICY "All authenticated users can view images" ON public.item_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage images" ON public.item_images FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inventory_staff')
);

-- RLS Policies for user_category_assignments
CREATE POLICY "Users can view their own category assignments" ON public.user_category_assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all category assignments" ON public.user_category_assignments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage category assignments" ON public.user_category_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers
CREATE TRIGGER update_delivery_notes_updated_at BEFORE UPDATE ON public.delivery_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_delivery_notes_customer ON public.delivery_notes(customer_id);
CREATE INDEX idx_delivery_notes_invoice ON public.delivery_notes(sales_invoice_id);
CREATE INDEX idx_delivery_note_items_note ON public.delivery_note_items(delivery_note_id);
CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_technical_datasheets_item ON public.technical_datasheets(inventory_item_id);
CREATE INDEX idx_item_images_item ON public.item_images(inventory_item_id);
CREATE INDEX idx_user_category_assignments_user ON public.user_category_assignments(user_id);

-- Create number generator functions
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  next_seq INTEGER;
BEGIN
  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM quotations
  WHERE quotation_number LIKE year_prefix || '%';
  new_number := year_prefix || LPAD(next_seq::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  next_seq INTEGER;
BEGIN
  year_prefix := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM purchase_orders
  WHERE order_number LIKE year_prefix || '%';
  new_number := year_prefix || LPAD(next_seq::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  next_seq INTEGER;
BEGIN
  year_prefix := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM sales_invoices
  WHERE invoice_number LIKE year_prefix || '%';
  new_number := year_prefix || LPAD(next_seq::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_delivery_note_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_prefix TEXT;
  next_seq INTEGER;
BEGIN
  year_prefix := 'DN-' || TO_CHAR(CURRENT_DATE, 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_note_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM delivery_notes
  WHERE delivery_note_number LIKE year_prefix || '%';
  new_number := year_prefix || LPAD(next_seq::TEXT, 4, '0');
  RETURN new_number;
END;
$$;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(module TEXT, action TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module, action FROM public.user_permissions WHERE user_id = _user_id
$$;