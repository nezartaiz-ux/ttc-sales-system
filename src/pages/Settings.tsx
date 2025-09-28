import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, User, Shield, Database } from "lucide-react";
import { UserManagementModal } from "@/components/modals/UserManagementModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const { isAdmin } = useUserRole();
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground">Configure system preferences and user management</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">System users</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Level</CardTitle>
              <Shield className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">High</div>
              <p className="text-xs text-muted-foreground">All systems secure</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Status</CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Online</div>
              <p className="text-xs text-muted-foreground">All connections active</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (!isAdmin) {
                      toast({ title: 'Permission denied', description: 'Only admins can manage users.', variant: 'destructive' });
                      return;
                    }
                    setIsUserManagementOpen(true);
                  }}
                  disabled={!isAdmin}
                >
                  <User className="h-4 w-4 mr-2" />
                  User Accounts
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (!isAdmin) {
                      toast({ title: 'Permission denied', description: 'Only admins can manage roles.', variant: 'destructive' });
                      return;
                    }
                    toast({ title: 'Info', description: 'Role management is available in User Accounts section.' });
                  }}
                  disabled={!isAdmin}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Role Management
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    if (!isAdmin) {
                      toast({ title: 'Permission denied', description: 'Only admins can manage permissions.', variant: 'destructive' });
                      return;
                    }
                    toast({ title: 'Info', description: 'Access permissions are managed through user roles.' });
                  }}
                  disabled={!isAdmin}
                >
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Access Permissions
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Database Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Company Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Administration</CardTitle>
            <CardDescription>Advanced system configuration and maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>System administration features will be implemented here</p>
              <p className="text-sm">Including backup management, audit logs, and system maintenance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserManagementModal
        open={isUserManagementOpen}
        onOpenChange={setIsUserManagementOpen}
      />
    </DashboardLayout>
  );
};

export default Settings;