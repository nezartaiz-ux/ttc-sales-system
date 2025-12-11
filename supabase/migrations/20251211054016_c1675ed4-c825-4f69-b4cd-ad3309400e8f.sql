-- Create delivery_notes table
CREATE TABLE public.delivery_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_note_number TEXT NOT NULL UNIQUE,
  delivery_note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  customer_address TEXT,
  model TEXT,
  warranty_type TEXT DEFAULT 'under_warranty',
  mean_of_despatch TEXT,
  mean_number TEXT,
  driver_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery_note_items table
CREATE TABLE public.delivery_note_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_note_id UUID NOT NULL REFERENCES public.delivery_notes(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  model TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_note_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_notes
CREATE POLICY "All authenticated users can view delivery notes"
  ON public.delivery_notes
  FOR SELECT
  USING (true);

CREATE POLICY "Users with permission can manage delivery notes"
  ON public.delivery_notes
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'sales_staff'::user_role) OR
    has_role(auth.uid(), 'inventory_staff'::user_role) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'delete'::permission_action)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'sales_staff'::user_role) OR
    has_role(auth.uid(), 'inventory_staff'::user_role) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action)
  );

-- RLS policies for delivery_note_items
CREATE POLICY "All authenticated users can view delivery note items"
  ON public.delivery_note_items
  FOR SELECT
  USING (true);

CREATE POLICY "Users with permission can manage delivery note items"
  ON public.delivery_note_items
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'sales_staff'::user_role) OR
    has_role(auth.uid(), 'inventory_staff'::user_role) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'delete'::permission_action)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR 
    has_role(auth.uid(), 'sales_staff'::user_role) OR
    has_role(auth.uid(), 'inventory_staff'::user_role) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'create'::permission_action) OR
    has_permission(auth.uid(), 'sales_invoices'::system_module, 'edit'::permission_action)
  );

-- Create function to generate delivery note number
CREATE OR REPLACE FUNCTION public.generate_delivery_note_number()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  current_month INTEGER;
  current_year INTEGER;
  next_num INTEGER;
  formatted_num TEXT;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE) - 2000;
  
  INSERT INTO serial_number_counters (document_type, month, year, counter)
  VALUES ('delivery_note', current_month, current_year, 1)
  ON CONFLICT (document_type, month, year) 
  DO UPDATE SET counter = serial_number_counters.counter + 1, updated_at = now()
  RETURNING counter INTO next_num;
  
  formatted_num := 'DN-' || LPAD(next_num::TEXT, 4, '0') || '-' || 
                   LPAD(current_month::TEXT, 2, '0') || '-' || 
                   LPAD(current_year::TEXT, 2, '0');
  RETURN formatted_num;
END;
$function$;

-- Add trigger for updated_at
CREATE TRIGGER update_delivery_notes_updated_at
  BEFORE UPDATE ON public.delivery_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();