-- Update admin role for nezartaiz@gmail.com
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'nezartaiz@gmail.com';