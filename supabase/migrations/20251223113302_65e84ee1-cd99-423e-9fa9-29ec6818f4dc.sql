-- Create equipment_images table
CREATE TABLE public.equipment_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('generator', 'equipment', 'tractor')),
  model TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can view equipment images" 
ON public.equipment_images 
FOR SELECT 
USING (true);

CREATE POLICY "Sales staff and admins can manage equipment images" 
ON public.equipment_images 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'sales_staff'::user_role, 'inventory_staff'::user_role]));

-- Create trigger for updated_at
CREATE TRIGGER update_equipment_images_updated_at
  BEFORE UPDATE ON public.equipment_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for equipment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true);

-- Create storage policies
CREATE POLICY "Equipment images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'equipment-images');

CREATE POLICY "Authenticated users can upload equipment images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own equipment images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');