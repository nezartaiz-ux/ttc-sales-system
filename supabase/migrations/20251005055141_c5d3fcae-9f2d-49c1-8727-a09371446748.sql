-- Create enum for system modules
CREATE TYPE public.system_module AS ENUM (
  'customers',
  'suppliers', 
  'inventory',
  'categories',
  'quotations',
  'purchase_orders',
  'sales_invoices',
  'reports',
  'settings'
);

-- Create enum for permission actions
CREATE TYPE public.permission_action AS ENUM (
  'view',
  'create',
  'edit',
  'delete'
);

-- Create user_permissions table
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module system_module NOT NULL,
  action permission_action NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, module, action)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all permissions"
  ON public.user_permissions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can view their own permissions"
  ON public.user_permissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all permissions"
  ON public.user_permissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create security definer function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id uuid,
  _module system_module,
  _action permission_action
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins always have all permissions
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

-- Create function to get user's permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(module system_module, action permission_action)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT module, action
  FROM public.user_permissions
  WHERE user_id = _user_id
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();