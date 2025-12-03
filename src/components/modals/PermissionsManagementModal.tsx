import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, X, RefreshCw } from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
}

interface UserPermission {
  module: string;
  action: string;
}

interface PermissionsManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MODULES = [
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'inventory', label: 'Inventory Items' },
  { id: 'categories', label: 'Product Categories' },
  { id: 'quotations', label: 'Quotations' },
  { id: 'purchase_orders', label: 'Purchase Orders' },
  { id: 'sales_invoices', label: 'Sales Invoices' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
];

const ACTIONS = [
  { id: 'view', label: 'View' },
  { id: 'create', label: 'Create' },
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
];

export function PermissionsManagementModal({ open, onOpenChange }: PermissionsManagementModalProps) {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('module, action')
        .eq('user_id', userId);

      if (error) throw error;

      const permSet = new Set<string>();
      (data as UserPermission[] || []).forEach((perm) => {
        permSet.add(`${perm.module}-${perm.action}`);
      });
      setPermissions(permSet);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && isAdmin) {
      fetchUsers();
    }
  }, [open, isAdmin]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser);
    } else {
      setPermissions(new Set());
    }
  }, [selectedUser]);

  const handleTogglePermission = (module: string, action: string) => {
    const key = `${module}-${action}`;
    const newPerms = new Set(permissions);
    if (newPerms.has(key)) {
      newPerms.delete(key);
    } else {
      newPerms.add(key);
    }
    setPermissions(newPerms);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUser);

      if (deleteError) throw deleteError;

      // Insert new permissions
      const permissionsToInsert = Array.from(permissions).map((key) => {
        const [module, action] = key.split('-');
        return {
          user_id: selectedUser,
          module: module as any,
          action: action as any,
        };
      });

      if (permissionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });
    } catch (error: any) {
      console.error('Save permissions error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedUserData = users.find(u => u.user_id === selectedUser);

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              Only administrators can manage permissions.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>User Permissions Management</DialogTitle>
          <DialogDescription>
            Define granular access rights for each user to system modules
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-[600px]">
          {/* Users List */}
          <div className="w-1/3 border-r pr-4">
            <h3 className="font-semibold mb-3">Select User</h3>
            <ScrollArea className="h-[550px]">
              {loading && !selectedUser ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <Button
                      key={user.user_id}
                      variant={selectedUser === user.user_id ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => setSelectedUser(user.user_id)}
                    >
                      <div className="text-left overflow-hidden">
                        <div className="font-medium truncate">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Permissions Grid */}
          <div className="flex-1">
            {selectedUser ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">
                    Permissions for {selectedUserData?.full_name}
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchUserPermissions(selectedUser)}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {MODULES.map((module) => (
                        <div key={module.id} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">{module.label}</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {ACTIONS.map((action) => {
                              const key = `${module.id}-${action.id}`;
                              return (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={key}
                                    checked={permissions.has(key)}
                                    onCheckedChange={() => 
                                      handleTogglePermission(module.id, action.id)
                                    }
                                  />
                                  <label
                                    htmlFor={key}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {action.label}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || loading}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Permissions
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a user to manage their permissions
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
