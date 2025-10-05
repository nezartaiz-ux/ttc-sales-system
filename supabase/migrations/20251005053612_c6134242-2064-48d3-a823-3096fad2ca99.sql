-- Reactivate all users that were accidentally deactivated
UPDATE public.profiles 
SET is_active = true 
WHERE is_active = false;