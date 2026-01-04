-- Create user_categories table to link users to product categories
CREATE TABLE public.user_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has access to a category
CREATE OR REPLACE FUNCTION public.has_category_access(_user_id uuid, _category_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    -- Admins have access to all categories
    SELECT CASE
        WHEN has_role(_user_id, 'admin'::user_role) THEN true
        -- Check if user has no category restrictions (empty = all access)
        WHEN NOT EXISTS (SELECT 1 FROM user_categories WHERE user_id = _user_id) THEN true
        -- Check if user has specific category access
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
    -- Admins get all categories
    SELECT CASE
        WHEN has_role(_user_id, 'admin'::user_role) THEN 
            ARRAY(SELECT id FROM product_categories)
        -- Users with no restrictions get all categories
        WHEN NOT EXISTS (SELECT 1 FROM user_categories WHERE user_id = _user_id) THEN 
            ARRAY(SELECT id FROM product_categories)
        -- Otherwise get user's assigned categories
        ELSE 
            ARRAY(SELECT category_id FROM user_categories WHERE user_id = _user_id)
    END
$$;

-- RLS Policies for user_categories
CREATE POLICY "Users can view their own categories"
ON public.user_categories
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user categories"
ON public.user_categories
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can manage user categories"
ON public.user_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Update trigger for updated_at
CREATE TRIGGER update_user_categories_updated_at
BEFORE UPDATE ON public.user_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();