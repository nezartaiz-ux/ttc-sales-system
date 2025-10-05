-- Restore admin role for the owner user after prior self-removal
INSERT INTO public.user_roles (user_id, role)
VALUES ('ed62cd3d-a9f9-4647-a233-ed37664f41ea', 'admin'::user_role)
ON CONFLICT (user_id, role) DO NOTHING;