import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AddItemModal } from "@/components/modals/AddItemModal";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserCategories } from "@/hooks/useUserCategories";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const Inventory = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const { isInventory, isAdmin } = useUserRole();
  const { userCategories, hasRestrictions, loading: categoriesLoading } = useUserCategories();
  const { toast } = useToast();

  const fetchItems = async () => {
    if (categoriesLoading) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('inventory_items')
        .select('*, product_categories(name), suppliers(name)')
        .order('product_categories(name)', { ascending: true });

      // Filter by user's categories if they have restrictions
      if (hasRestrictions && userCategories.length > 0) {
        const categoryIds = userCategories.map(c => c.id);
        query = query.in('category_id', categoryIds);
      }

      const { data, error } = await query;
      
      if (error) {
        toast({ title: 'Error', description: `Failed to load inventory: ${error.message}`, variant: 'destructive' });
      } else {
        setItems(data || []);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to load inventory: ${error.message}`, variant: 'destructive' });
    }
    setLoading(false);
  };

  // Filter items based on in-stock toggle
  const filteredItems = showInStockOnly 
    ? items.filter(item => item.quantity > 0)
    : items;

  const groupedItems = filteredItems.reduce((acc: Record<string, any[]>, item) => {
    const category = item.product_categories?.name || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (!categoriesLoading) {
      fetchItems();
    }
  }, [categoriesLoading, userCategories]);

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Item deleted successfully' });
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to delete item: ${error.message}`, variant: 'destructive' });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Track CAT gensets, heavy equipment & MF tractors</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="in-stock-filter"
                checked={showInStockOnly}
                onCheckedChange={setShowInStockOnly}
              />
              <Label htmlFor="in-stock-filter" className="text-sm cursor-pointer">
                In Stock Only
              </Label>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">All inventory items</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.filter(i => i.quantity > 0).length}</div>
              <p className="text-xs text-muted-foreground">Items available</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Items</CardTitle>
              <Package className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.filter(i => i.is_active).length}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Current value</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {items.filter(i => i.min_stock_level && i.quantity <= i.min_stock_level).length}
              </div>
              <p className="text-xs text-muted-foreground">Need reorder</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">Loading inventory...</div>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{showInStockOnly ? 'No items in stock' : 'No inventory items found'}</p>
                  <p className="text-sm">{showInStockOnly ? 'All items are out of stock' : 'Add your first item using the button above'}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedItems).map(([category, categoryItems]: [string, any[]]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                  <CardDescription>{categoryItems.length} items in this category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Selling Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryItems.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.sku || '-'}</TableCell>
                            <TableCell>{item.suppliers?.name || '-'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unit_price}</TableCell>
                            <TableCell>${item.selling_price}</TableCell>
                            <TableCell>
                              <span className={item.is_active ? "text-green-600" : "text-red-600"}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (!isInventory) {
                                      toast({ title: 'Permission denied', description: 'Only inventory staff or admins can edit items.', variant: 'destructive' });
                                      return;
                                    }
                                    setEditingItem(item);
                                  }}
                                  disabled={!isInventory}
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                {isAdmin && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" title="Delete">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteItem(item.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AddItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={fetchItems}
      />
      
      <AddItemModal
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        onSuccess={fetchItems}
        editItem={editingItem}
      />
    </DashboardLayout>
  );
};

export default Inventory;