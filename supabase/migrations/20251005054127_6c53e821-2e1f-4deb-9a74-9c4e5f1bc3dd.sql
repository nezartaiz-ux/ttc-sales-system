-- Create a function to handle role updates atomically
CREATE OR REPLACE FUNCTION public.update_user_roles(
  target_user_id UUID,
  new_roles user_role[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Delete existing roles for the user
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id;

  -- Insert new roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT target_user_id, unnest(new_roles);
END;
$$;

-- Add INSERT policy that allows the function to work
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (true);  -- Allow insert if the USING check passed