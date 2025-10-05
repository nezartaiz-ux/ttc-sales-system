-- Add admin role to nezartaiz@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::user_role
FROM public.profiles
WHERE email = 'nezartaiz@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;