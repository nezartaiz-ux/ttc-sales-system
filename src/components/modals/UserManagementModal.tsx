import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, User, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[]; // Array of role strings from user_roles table
}

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementModal = ({ open, onOpenChange }: UserManagementModalProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const AVAILABLE_ROLES = ['admin', 'sales_staff', 'inventory_staff', 'accountant'];

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch user_roles for each user
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: (userRoles || [])
          .filter(ur => ur.user_id === profile.user_id)
          .map(ur => ur.role)
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to fetch users: ${error.message}`,
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

  const startEditingRoles = (user: UserProfile) => {
    setEditingUserId(user.user_id);
    setSelectedRoles(user.roles);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setSelectedRoles([]);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const saveRoles = async (userId: string) => {
    if (selectedRoles.length === 0) {
      toast({
        title: 'Error',
        description: 'User must have at least one role',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Prevent self lockout: do not allow removing your own admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId && !selectedRoles.includes('admin')) {
        toast({
          title: 'Blocked',
          description: 'You cannot remove your own admin role. Assign admin or ask another admin to change your roles.',
          variant: 'destructive',
        });
        return;
      }

      // Use secure RPC to update roles atomically under RLS
      const { error } = await supabase.rpc('update_user_roles', {
        target_user_id: userId,
        new_roles: selectedRoles as any, // enum[] on the DB side
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User authorities updated successfully',
      });
      
      cancelEditing();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update roles: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update user status: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Denied</DialogTitle>
            <DialogDescription>
              Only administrators can access user management.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Manage user accounts, roles, and permissions.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Authorities Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Authorities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          {editingUserId === user.user_id ? (
                            <div className="space-y-2 min-w-[200px]">
                              {AVAILABLE_ROLES.map(role => (
                                <div key={role} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${user.user_id}-${role}`}
                                    checked={selectedRoles.includes(role)}
                                    onCheckedChange={() => toggleRole(role)}
                                  />
                                  <Label 
                                    htmlFor={`${user.user_id}-${role}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {user.roles.length > 0 ? user.roles.map(role => (
                                <Badge key={role} variant="secondary">
                                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                              )) : (
                                <span className="text-muted-foreground text-sm">No roles assigned</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.is_active ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {editingUserId === user.user_id ? (
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => saveRoles(user.user_id)}
                              >
                                Save
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => startEditingRoles(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleToggleActive(user.id, user.is_active)}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={fetchUsers}>
            Refresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};