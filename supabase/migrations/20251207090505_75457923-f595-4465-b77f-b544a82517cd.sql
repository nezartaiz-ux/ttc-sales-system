-- Drop existing restrictive policies for quotations and quotation_items
DROP POLICY IF EXISTS "Sales staff and admins can manage quotations" ON public.quotations;
DROP POLICY IF EXISTS "Sales staff and admins can manage quotation items" ON public.quotation_items;

-- Create new policies that check both roles AND custom permissions
CREATE POLICY "Users with permission can manage quotations"
ON public.quotations
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'edit'::permission_action)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'delete'::permission_action)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'edit'::permission_action)
);

CREATE POLICY "Users with permission can manage quotation items"
ON public.quotation_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'edit'::permission_action)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'delete'::permission_action)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'sales_staff'::user_role)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'create'::permission_action)
  OR has_permission(auth.uid(), 'quotations'::system_module, 'edit'::permission_action)
);