import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

const Inventory = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isInventory } = useUserRole();
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*, product_categories(name), suppliers(name)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: `Failed to load inventory: ${error.message}`, variant: 'destructive' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Track CAT gensets, heavy equipment & MF tractors</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              if (!isInventory) {
                toast({ title: 'Permission denied', description: 'Only inventory staff or admins can add items.', variant: 'destructive' });
                return;
              }
              setIsAddModalOpen(true);
            }}
            disabled={!isInventory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary">+12</span> this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CAT Equipment</CardTitle>
              <Package className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Gensets & Heavy</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MF Tractors</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">Agricultural equipment</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Need reorder</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
              <CardDescription>Stock distribution across product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">CAT Gensets</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-primary/20 rounded-full">
                      <div className="w-16 h-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">78</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CAT Heavy Equipment</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-primary/20 rounded-full">
                      <div className="w-14 h-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">68</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MF Agricultural Tractors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-accent/20 rounded-full">
                      <div className="w-18 h-2 bg-accent rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">89</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Parts & Accessories</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-primary/20 rounded-full">
                      <div className="w-6 h-2 bg-primary rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">10</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>All items in stock</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory items found</p>
                  <p className="text-sm">Add your first item using the button above</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.sku || '-'}</TableCell>
                          <TableCell>{item.product_categories?.name || '-'}</TableCell>
                          <TableCell>{item.suppliers?.name || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.unit_price}</TableCell>
                          <TableCell>${item.selling_price}</TableCell>
                          <TableCell>
                            <span className={item.is_active ? "text-green-600" : "text-red-600"}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
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
      </div>

      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchItems}
      />
    </DashboardLayout>
  );
};

export default Inventory;