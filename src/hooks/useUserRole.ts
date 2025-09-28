import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'sales_staff' | 'inventory_staff' | 'accountant' | null;

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase.rpc('get_current_user_role');
        if (error) throw error;
        if (mounted) setRole(data as UserRole);
      } catch (e) {
        if (mounted) setRole(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRole();

    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      // Refetch on auth changes
      fetchRole();
    });

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isSales: role === 'sales_staff',
    isInventory: role === 'inventory_staff' || role === 'admin',
    isAccountant: role === 'accountant',
  };
};