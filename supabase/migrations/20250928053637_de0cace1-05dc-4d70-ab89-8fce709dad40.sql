-- Update the handle_new_user function to include the new admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.email IN ('nezar@tehama.com', 'nezraraiz@gmail.com') THEN 'admin'::user_role
      ELSE 'sales_staff'::user_role
    END
  );
  RETURN NEW;
END;
$function$;