-- Drop existing restrictive policies for purchase_orders and purchase_order_items
DROP POLICY IF EXISTS "Inventory staff and admins can manage purchase orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Inventory staff and admins can manage purchase order items" ON public.purchase_order_items;

-- Create new policies for purchase_orders that check both roles AND custom permissions
CREATE POLICY "Users with permission can manage purchase orders"
ON public.purchase_orders
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'edit'::permission_action)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'delete'::permission_action)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'edit'::permission_action)
);

CREATE POLICY "Users with permission can manage purchase order items"
ON public.purchase_order_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'edit'::permission_action)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'delete'::permission_action)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'inventory_staff'::user_role)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'purchase_orders'::system_module, 'edit'::permission_action)
);

-- Drop existing restrictive policies for sales_invoices and sales_invoice_items
DROP POLICY IF EXISTS "Sales staff, accountants and admins can manage invoices" ON public.sales_invoices;
DROP POLICY IF EXISTS "Sales staff, accountants and admins can manage invoice items" ON public.sales_invoice_items;

-- Create new policies for sales_invoices that check both roles AND custom permissions
CREATE POLICY "Users with permission can manage sales invoices"
ON public.sales_invoices
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'delete'::permission_action)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action)
);

CREATE POLICY "Users with permission can manage sales invoice items"
ON public.sales_invoice_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'delete'::permission_action)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_role(auth.uid(), 'accountant'::user_role)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action)
);