-- Add missing columns to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS customs_duty_status TEXT,
ADD COLUMN IF NOT EXISTS discount_type TEXT,
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0;

-- Create equipment_images table (alias for item_images with additional fields)
CREATE TABLE public.equipment_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  model TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_categories table (alias for user_category_assignments)
CREATE TABLE public.user_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equipment_images
CREATE POLICY "All authenticated users can view equipment images" ON public.equipment_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage equipment images" ON public.equipment_images FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'inventory_staff')
);

-- RLS Policies for user_categories
CREATE POLICY "Users can view their own category assignments" ON public.user_categories FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all category assignments" ON public.user_categories FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage category assignments" ON public.user_categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_equipment_images_category ON public.equipment_images(category);
CREATE INDEX idx_user_categories_user ON public.user_categories(user_id);

-- Create update_user_roles function
CREATE OR REPLACE FUNCTION public.update_user_roles(_user_id uuid, _role user_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing roles for the user
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role);
  
  -- Also update profile role for backward compatibility
  UPDATE public.profiles SET role = _role WHERE profiles.user_id = _user_id;
END;
$$;