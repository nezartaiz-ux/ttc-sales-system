-- Create enum for datasheet categories
CREATE TYPE datasheet_category AS ENUM ('generator', 'equipment', 'tractor');

-- Create technical_datasheets table
CREATE TABLE public.technical_datasheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category datasheet_category NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technical_datasheets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view datasheets"
  ON public.technical_datasheets
  FOR SELECT
  USING (true);

CREATE POLICY "Sales staff and admins can manage datasheets"
  ON public.technical_datasheets
  FOR ALL
  USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'sales_staff'::user_role, 'inventory_staff'::user_role]));

-- Create storage bucket for datasheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasheets', 'datasheets', true);

-- Storage RLS Policies
CREATE POLICY "Public can view datasheets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'datasheets');

CREATE POLICY "Authenticated users can upload datasheets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'datasheets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete their datasheets"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'datasheets' AND auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE TRIGGER update_technical_datasheets_updated_at
  BEFORE UPDATE ON public.technical_datasheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();