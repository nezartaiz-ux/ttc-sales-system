-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'sales_staff', 'inventory_staff', 'accountant', 'management');

-- Create invoice types enum
CREATE TYPE public.invoice_type AS ENUM ('cash', 'credit');

-- Create quotation status enum
CREATE TYPE public.quotation_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- Create purchase order status enum
CREATE TYPE public.purchase_order_status AS ENUM ('draft', 'sent', 'received', 'cancelled');

-- Create invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'sales_staff',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.product_categories (name, description) VALUES
('Electric Generators', 'Electric power generators of various capacities'),
('Heavy Equipment', 'Heavy machinery and construction equipment'),
('Agricultural Tractors', 'Farming and agricultural tractors');

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES public.product_categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  sku TEXT UNIQUE,
  batch_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotations table
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  validity_period DATE,
  status quotation_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation items table
CREATE TABLE public.quotation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  expected_delivery_date DATE,
  status purchase_order_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales invoices table
CREATE TABLE public.sales_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  quotation_id UUID REFERENCES public.quotations(id),
  invoice_type invoice_type NOT NULL DEFAULT 'cash',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_terms INTEGER, -- days for credit sales
  due_date DATE,
  status invoice_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales invoice items table
CREATE TABLE public.sales_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.get_current_user_role() = 'admin');

-- Create policies for product categories (read-only for most users)
CREATE POLICY "All authenticated users can view categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.product_categories FOR ALL USING (public.get_current_user_role() = 'admin');

-- Create policies for customers
CREATE POLICY "All authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff and admins can manage customers" ON public.customers FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'sales_staff')
);

-- Create policies for suppliers
CREATE POLICY "All authenticated users can view suppliers" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage suppliers" ON public.suppliers FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'inventory_staff')
);

-- Create policies for inventory items
CREATE POLICY "All authenticated users can view inventory" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage inventory" ON public.inventory_items FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'inventory_staff')
);

-- Create policies for quotations
CREATE POLICY "All authenticated users can view quotations" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff and admins can manage quotations" ON public.quotations FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'sales_staff')
);

-- Create policies for quotation items
CREATE POLICY "All authenticated users can view quotation items" ON public.quotation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff and admins can manage quotation items" ON public.quotation_items FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'sales_staff')
);

-- Create policies for purchase orders
CREATE POLICY "All authenticated users can view purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage purchase orders" ON public.purchase_orders FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'inventory_staff')
);

-- Create policies for purchase order items
CREATE POLICY "All authenticated users can view purchase order items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Inventory staff and admins can manage purchase order items" ON public.purchase_order_items FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'inventory_staff')
);

-- Create policies for sales invoices
CREATE POLICY "All authenticated users can view sales invoices" ON public.sales_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff, accountants and admins can manage invoices" ON public.sales_invoices FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'sales_staff', 'accountant')
);

-- Create policies for sales invoice items
CREATE POLICY "All authenticated users can view sales invoice items" ON public.sales_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales staff, accountants and admins can manage invoice items" ON public.sales_invoice_items FOR ALL USING (
  public.get_current_user_role() IN ('admin', 'sales_staff', 'accountant')
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON public.sales_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_suppliers_name ON public.suppliers(name);
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category_id);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_quotations_customer ON public.quotations(customer_id);
CREATE INDEX idx_quotations_number ON public.quotations(quotation_number);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_number ON public.purchase_orders(order_number);
CREATE INDEX idx_sales_invoices_customer ON public.sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_number ON public.sales_invoices(invoice_number);
CREATE INDEX idx_sales_invoices_date ON public.sales_invoices(created_at);