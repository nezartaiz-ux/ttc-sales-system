import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pencil, Trash2, Plus, User, Shield, UserPlus, Loader2, Eye, EyeOff, Key, FolderOpen } from 'lucide-react';
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
  roles: string[];
  assignedCategories: string[];
}

interface Category {
  id: string;
  name: string;
}

interface UserManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserManagementModal = ({ open, onOpenChange }: UserManagementModalProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState('sales_staff');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editingCategoriesUserId, setEditingCategoriesUserId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savingCategories, setSavingCategories] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useUserRole();

  const AVAILABLE_ROLES = ['admin', 'sales_staff', 'inventory_staff', 'accountant', 'management'];

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch user categories
      const { data: userCats, error: catsError } = await supabase
        .from('user_categories')
        .select('user_id, category_id');

      if (catsError) throw catsError;

      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        roles: (userRoles || [])
          .filter(ur => ur.user_id === profile.user_id)
          .map(ur => ur.role),
        assignedCategories: (userCats || [])
          .filter(uc => uc.user_id === profile.user_id)
          .map(uc => uc.category_id)
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
      fetchCategories();
    }
  }, [open, isAdmin]);

  const startEditingCategories = (user: UserProfile) => {
    setEditingCategoriesUserId(user.user_id);
    setSelectedCategories(user.assignedCategories || []);
  };

  const cancelEditingCategories = () => {
    setEditingCategoriesUserId(null);
    setSelectedCategories([]);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const saveCategories = async (userId: string) => {
    setSavingCategories(true);
    try {
      // Delete existing category assignments
      await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', userId);

      // Insert new category assignments
      if (selectedCategories.length > 0) {
        const { error } = await supabase
          .from('user_categories')
          .insert(
            selectedCategories.map(categoryId => ({
              user_id: userId,
              category_id: categoryId,
            }))
          );

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: selectedCategories.length > 0 
          ? 'User categories updated successfully' 
          : 'Category restrictions removed - user can see all categories',
      });
      
      cancelEditingCategories();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to update categories: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setSavingCategories(false);
    }
  };

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
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === userId && !selectedRoles.includes('admin')) {
        toast({
          title: 'Blocked',
          description: 'You cannot remove your own admin role.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.rpc('update_user_roles', {
        _user_id: userId,
        _role: selectedRoles[0] as any,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User roles updated successfully',
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

  const handleResetPassword = async (userId: string) => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setResettingPassword(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser && currentUser.id === userId) {
        // Current user can update their own password directly
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Password updated successfully',
        });
      } else {
        // For other users, use the admin edge function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await supabase.functions.invoke('admin-reset-password', {
          body: {
            targetUserId: userId,
            newPassword: newPassword,
          },
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to reset password');
        }

        if (response.data?.error) {
          throw new Error(response.data.error);
        }
        
        toast({
          title: 'Success',
          description: 'Password has been reset successfully',
        });
      }
      
      setResetPasswordUserId(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setCreatingUser(true);
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserFullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the profile with additional info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: newUserFullName,
          phone: newUserPhone || null,
          is_active: true,
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      // Set the user's role using RPC
      const { error: roleError } = await supabase.rpc('update_user_roles', {
        _user_id: authData.user.id,
        _role: newUserRole as any,
      });

      if (roleError) {
        console.error('Role assignment error:', roleError);
      }

      toast({
        title: 'Success',
        description: 'User created successfully. They can now log in.',
      });

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserPhone('');
      setNewUserRole('sales_staff');
      setShowAddUser(false);
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    setDeletingUser(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (currentUser && currentUser.id === deleteUserId) {
        toast({
          title: 'Error',
          description: 'You cannot delete your own account',
          variant: 'destructive',
        });
        setDeletingUser(false);
        return;
      }

      // Use edge function to delete user from auth.users
      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { targetUserId: deleteUserId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to delete user');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
      
      setDeleteUserId(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setDeletingUser(false);
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
      <DialogContent className="max-w-[95vw] sm:max-w-[900px] lg:max-w-[1100px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>User Management</DialogTitle>
          <DialogDescription>
            Manage user accounts, roles, and permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Add New User Section */}
          {showAddUser && (
            <Card className="mb-4 flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5" />
                  Add New User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newUserFullName">Full Name *</Label>
                    <Input
                      id="newUserFullName"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserEmail">Email *</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserPassword">Password *</Label>
                    <div className="relative">
                      <Input
                        id="newUserPassword"
                        type={showPassword ? "text" : "password"}
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserPhone">Phone</Label>
                    <Input
                      id="newUserPhone"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserRole">Role *</Label>
                    <Select value={newUserRole} onValueChange={setNewUserRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateUser} disabled={creatingUser}>
                    {creatingUser ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create User
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User Accounts
                </CardTitle>
                {!showAddUser && (
                  <Button size="sm" onClick={() => setShowAddUser(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
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
                <div className="overflow-auto max-h-[400px] px-4 pb-4">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Name</TableHead>
                        <TableHead className="whitespace-nowrap">Email</TableHead>
                        <TableHead className="whitespace-nowrap hidden md:table-cell">Phone</TableHead>
                        <TableHead className="whitespace-nowrap">Roles</TableHead>
                        <TableHead className="whitespace-nowrap">Categories</TableHead>
                        <TableHead className="whitespace-nowrap">Status</TableHead>
                        <TableHead className="whitespace-nowrap min-w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium whitespace-nowrap">{user.full_name}</TableCell>
                          <TableCell className="whitespace-nowrap">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell whitespace-nowrap">{user.phone || '-'}</TableCell>
                          <TableCell>
                            {editingUserId === user.user_id ? (
                              <div className="space-y-2 min-w-[180px]">
                                {AVAILABLE_ROLES.map(role => (
                                  <div key={role} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${user.user_id}-${role}`}
                                      checked={selectedRoles.includes(role)}
                                      onCheckedChange={() => toggleRole(role)}
                                    />
                                    <Label 
                                      htmlFor={`${user.user_id}-${role}`}
                                      className="text-sm font-normal cursor-pointer whitespace-nowrap"
                                    >
                                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {user.roles.length > 0 ? user.roles.map(role => (
                                  <Badge key={role} variant="secondary" className="text-xs whitespace-nowrap">
                                    {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                )) : (
                                  <span className="text-muted-foreground text-sm">No roles</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCategoriesUserId === user.user_id ? (
                              <div className="space-y-2 min-w-[200px] max-h-[200px] overflow-y-auto">
                                {categories.map(cat => (
                                  <div key={cat.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${user.user_id}-cat-${cat.id}`}
                                      checked={selectedCategories.includes(cat.id)}
                                      onCheckedChange={() => toggleCategory(cat.id)}
                                    />
                                    <Label 
                                      htmlFor={`${user.user_id}-cat-${cat.id}`}
                                      className="text-xs font-normal cursor-pointer whitespace-nowrap"
                                    >
                                      {cat.name}
                                    </Label>
                                  </div>
                                ))}
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => saveCategories(user.user_id)}
                                    disabled={savingCategories}
                                  >
                                    {savingCategories ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={cancelEditingCategories}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {user.assignedCategories && user.assignedCategories.length > 0 ? (
                                  <>
                                    <Badge variant="outline" className="text-xs">
                                      {user.assignedCategories.length} {user.assignedCategories.length === 1 ? 'category' : 'categories'}
                                    </Badge>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => startEditingCategories(user)}
                                      title="Edit Categories"
                                      className="h-6 w-6 p-0"
                                    >
                                      <FolderOpen className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-muted-foreground text-xs">All</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => startEditingCategories(user)}
                                      title="Assign Categories"
                                      className="h-6 w-6 p-0"
                                    >
                                      <FolderOpen className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.is_active ? "default" : "secondary"}
                              className="cursor-pointer whitespace-nowrap"
                              onClick={() => handleToggleActive(user.id, user.is_active)}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[200px]">
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
                            ) : resetPasswordUserId === user.user_id ? (
                              <div className="flex flex-col gap-2 min-w-[220px]">
                                <div className="relative">
                                  <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="New password (min 6 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pr-10"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                  >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleResetPassword(user.user_id)}
                                    disabled={resettingPassword}
                                  >
                                    {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset'}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => { setResetPasswordUserId(null); setNewPassword(''); }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 flex-nowrap">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => startEditingRoles(user)}
                                  title="Edit roles"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setResetPasswordUserId(user.user_id)}
                                  title="Reset password"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleToggleActive(user.id, user.is_active)}
                                  title={user.is_active ? 'Deactivate' : 'Activate'}
                                  className="whitespace-nowrap"
                                >
                                  {user.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDeleteUserId(user.user_id)}
                                  title="Delete user"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
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
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={fetchUsers}>
            Refresh
          </Button>
        </div>
      </DialogContent>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              The user will lose access to the system and all their role and category assignments will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};