import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SystemModule = 
  | 'customers'
  | 'suppliers'
  | 'inventory'
  | 'categories'
  | 'quotations'
  | 'purchase_orders'
  | 'sales_invoices'
  | 'delivery_notes'
  | 'image_gallery'
  | 'reports'
  | 'settings';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

interface Permission {
  module: SystemModule;
  action: PermissionAction;
}

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_permissions', { _user_id: user.id });
        
        if (error) throw error;
        setPermissions((data || []) as Permission[]);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (module: SystemModule, action: PermissionAction): boolean => {
    return permissions.some(p => p.module === module && p.action === action);
  };

  const canView = (module: SystemModule) => hasPermission(module, 'view');
  const canCreate = (module: SystemModule) => hasPermission(module, 'create');
  const canEdit = (module: SystemModule) => hasPermission(module, 'edit');
  const canDelete = (module: SystemModule) => hasPermission(module, 'delete');

  return {
    permissions,
    loading,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
};
