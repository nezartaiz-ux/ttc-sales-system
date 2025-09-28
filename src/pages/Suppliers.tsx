import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Truck } from "lucide-react";
import { AddSupplierModal } from "@/components/modals/AddSupplierModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

const Suppliers = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { isInventory } = useUserRole();
  const { toast } = useToast();
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground">Manage your supplier network</p>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90"
            onClick={() => {
              if (!isInventory) {
                toast({ title: 'Permission denied', description: 'Only inventory staff or admins can add suppliers.', variant: 'destructive' });
                return;
              }
              setIsAddModalOpen(true);
            }}
            disabled={!isInventory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-accent">+2</span> new this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <p className="text-xs text-muted-foreground">82% of total</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Key Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Strategic partners</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Supplier List</CardTitle>
            <CardDescription>All registered suppliers in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Supplier management features will be implemented here</p>
              <p className="text-sm">Including add, edit, delete, and search functionality</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddSupplierModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => {
          // Refresh supplier list here when we implement it
        }}
      />
    </DashboardLayout>
  );
};

export default Suppliers;