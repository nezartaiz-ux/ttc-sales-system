-- Add discount fields to sales_invoices table if not exist
ALTER TABLE public.sales_invoices
ADD COLUMN IF NOT EXISTS discount_type TEXT,
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0;

-- Add customs_duty_status column to purchase_orders table
ALTER TABLE public.purchase_orders
ADD COLUMN IF NOT EXISTS customs_duty_status TEXT;

-- Add additional delivery_notes columns from the migration
ALTER TABLE public.delivery_notes
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS warranty_type TEXT DEFAULT 'under_warranty',
ADD COLUMN IF NOT EXISTS mean_of_despatch TEXT,
ADD COLUMN IF NOT EXISTS mean_number TEXT;

-- Create indexes for delivery_notes if not exist
CREATE INDEX IF NOT EXISTS idx_delivery_notes_invoice ON public.delivery_notes(sales_invoice_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_customer ON public.delivery_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON public.delivery_notes(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_status ON public.delivery_notes(status);

-- Add mime_type to equipment_images if not exist
ALTER TABLE public.equipment_images
ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Add is_primary to equipment_images if not exist  
ALTER TABLE public.equipment_images
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Create has_permission function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id uuid,
  _module text,
  _action text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN has_role(_user_id, 'admin'::user_role) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.user_permissions
      WHERE user_id = _user_id
        AND module = _module
        AND action = _action
    )
  END
$$;

-- Create has_category_access function
CREATE OR REPLACE FUNCTION public.has_category_access(_user_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN has_role(_user_id, 'admin'::user_role) THEN true
        WHEN NOT EXISTS (SELECT 1 FROM user_categories WHERE user_id = _user_id) THEN true
        ELSE EXISTS (
            SELECT 1
            FROM user_categories
            WHERE user_id = _user_id
            AND category_id = _category_id
        )
    END
$$;

-- Create function to get user's accessible category IDs
CREATE OR REPLACE FUNCTION public.get_user_category_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN has_role(_user_id, 'admin'::user_role) THEN 
            ARRAY(SELECT id FROM product_categories)
        WHEN NOT EXISTS (SELECT 1 FROM user_categories WHERE user_id = _user_id) THEN 
            ARRAY(SELECT id FROM product_categories)
        ELSE 
            ARRAY(SELECT category_id FROM user_categories WHERE user_id = _user_id)
    END
$$;

-- Update RLS policies for quotations to include permissions
DROP POLICY IF EXISTS "Sales staff and admins can manage quotations" ON public.quotations;
DROP POLICY IF EXISTS "Users with permission can manage quotations" ON public.quotations;

CREATE POLICY "Users with permission can manage quotations"
ON public.quotations
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations', 'create')
  OR has_permission(auth.uid(), 'quotations', 'edit')
  OR has_permission(auth.uid(), 'quotations', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations', 'create')
  OR has_permission(auth.uid(), 'quotations', 'edit')
);

-- Update RLS policies for quotation_items
DROP POLICY IF EXISTS "Sales staff and admins can manage quotation items" ON public.quotation_items;
DROP POLICY IF EXISTS "Users with permission can manage quotation items" ON public.quotation_items;

CREATE POLICY "Users with permission can manage quotation items"
ON public.quotation_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations', 'create')
  OR has_permission(auth.uid(), 'quotations', 'edit')
  OR has_permission(auth.uid(), 'quotations', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations', 'create')
  OR has_permission(auth.uid(), 'quotations', 'edit')
);

-- Update RLS policies for purchase_orders
DROP POLICY IF EXISTS "Inventory staff and admins can manage purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Users with permission can manage purchase orders" ON public.purchase_orders;

CREATE POLICY "Users with permission can manage purchase orders"
ON public.purchase_orders
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders', 'create')
  OR has_permission(auth.uid(), 'purchase_orders', 'edit')
  OR has_permission(auth.uid(), 'purchase_orders', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders', 'create')
  OR has_permission(auth.uid(), 'purchase_orders', 'edit')
);

-- Update RLS policies for purchase_order_items
DROP POLICY IF EXISTS "Inventory staff and admins can manage purchase order items" ON public.purchase_order_items;
DROP POLICY IF EXISTS "Users with permission can manage purchase order items" ON public.purchase_order_items;

CREATE POLICY "Users with permission can manage purchase order items"
ON public.purchase_order_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders', 'create')
  OR has_permission(auth.uid(), 'purchase_orders', 'edit')
  OR has_permission(auth.uid(), 'purchase_orders', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders', 'create')
  OR has_permission(auth.uid(), 'purchase_orders', 'edit')
);

-- Update RLS policies for sales_invoices
DROP POLICY IF EXISTS "Sales staff, accountants and admins can manage invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Users with permission can manage sales invoices" ON public.sales_invoices;

CREATE POLICY "Users with permission can manage sales invoices"
ON public.sales_invoices
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices', 'create')
  OR has_permission(auth.uid(), 'sales_invoices', 'edit')
  OR has_permission(auth.uid(), 'sales_invoices', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices', 'create')
  OR has_permission(auth.uid(), 'sales_invoices', 'edit')
);

-- Update RLS policies for sales_invoice_items
DROP POLICY IF EXISTS "Sales staff, accountants and admins can manage invoice items" ON public.sales_invoice_items;
DROP POLICY IF EXISTS "Users with permission can manage sales invoice items" ON public.sales_invoice_items;

CREATE POLICY "Users with permission can manage sales invoice items"
ON public.sales_invoice_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices', 'create')
  OR has_permission(auth.uid(), 'sales_invoices', 'edit')
  OR has_permission(auth.uid(), 'sales_invoices', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices', 'create')
  OR has_permission(auth.uid(), 'sales_invoices', 'edit')
);

-- Update RLS policies for delivery_notes
DROP POLICY IF EXISTS "Sales staff and admins can manage delivery notes" ON public.delivery_notes;
DROP POLICY IF EXISTS "Users with permission can manage delivery notes" ON public.delivery_notes;

CREATE POLICY "Users with permission can manage delivery notes"
ON public.delivery_notes
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'delivery_notes', 'create')
  OR has_permission(auth.uid(), 'delivery_notes', 'edit')
  OR has_permission(auth.uid(), 'delivery_notes', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'delivery_notes', 'create')
  OR has_permission(auth.uid(), 'delivery_notes', 'edit')
);

-- Update RLS policies for delivery_note_items
DROP POLICY IF EXISTS "Sales staff and admins can manage delivery note items" ON public.delivery_note_items;
DROP POLICY IF EXISTS "Users with permission can manage delivery note items" ON public.delivery_note_items;

CREATE POLICY "Users with permission can manage delivery note items"
ON public.delivery_note_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'delivery_notes', 'create')
  OR has_permission(auth.uid(), 'delivery_notes', 'edit')
  OR has_permission(auth.uid(), 'delivery_notes', 'delete')
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'delivery_notes', 'create')
  OR has_permission(auth.uid(), 'delivery_notes', 'edit')
);

-- Update RLS policies for equipment_images
DROP POLICY IF EXISTS "Inventory staff and admins can manage equipment images" ON public.equipment_images;
DROP POLICY IF EXISTS "Sales staff and admins can manage equipment images" ON public.equipment_images;

CREATE POLICY "Users with permission can manage equipment images"
ON public.equipment_images
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'image_gallery', 'create')
  OR has_permission(auth.uid(), 'image_gallery', 'edit')
  OR has_permission(auth.uid(), 'image_gallery', 'delete')
);