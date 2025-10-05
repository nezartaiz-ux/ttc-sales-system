import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart, Truck, Package, Eye, Download, Printer } from "lucide-react";
import { CreatePOModal } from "@/components/modals/CreatePOModal";
import { ViewPOModal } from "@/components/modals/ViewPOModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generatePOPDF, printPO } from "@/utils/pdfExport";

const PurchaseOrders = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useUserRole();
  const { canCreate, canView } = useUserPermissions();
  const { toast } = useToast();

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(name), purchase_order_items(*, inventory_items(name))')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: `Failed to load purchase orders: ${error.message}`, variant: 'destructive' });
    } else {
      setPurchaseOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleView = (po: any) => {
    setSelectedPO(po);
    setIsViewModalOpen(true);
  };

  const handleDownloadPDF = (po: any) => {
    generatePOPDF({
      order_number: po.order_number,
      supplier_name: po.suppliers?.name || 'N/A',
      expected_delivery_date: po.expected_delivery_date || 'N/A',
      total_amount: po.total_amount || 0,
      tax_amount: po.tax_amount || 0,
      grand_total: po.grand_total || 0,
      items: po.purchase_order_items?.map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      notes: po.notes
    });
  };

  const handlePrint = (po: any) => {
    printPO({
      order_number: po.order_number,
      supplier_name: po.suppliers?.name || 'N/A',
      expected_delivery_date: po.expected_delivery_date || 'N/A',
      total_amount: po.total_amount || 0,
      tax_amount: po.tax_amount || 0,
      grand_total: po.grand_total || 0,
      items: po.purchase_order_items?.map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      notes: po.notes
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage procurement and supplier orders</p>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90"
            onClick={() => {
              if (!isAdmin && !canCreate('purchase_orders')) {
                toast({ title: 'Permission denied', description: 'You do not have permission to create purchase orders.', variant: 'destructive' });
                return;
              }
              setIsCreateModalOpen(true);
            }}
            disabled={!isAdmin && !canCreate('purchase_orders')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total POs</CardTitle>
              <ShoppingCart className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-accent">+5</span> this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <ShoppingCart className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">En route</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">69</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Management</CardTitle>
            <CardDescription>Track orders from creation to delivery</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading purchase orders...</div>
            ) : purchaseOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No purchase orders found</p>
                <p className="text-sm">Create your first PO using the button above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead>Grand Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.order_number}</TableCell>
                        <TableCell>{po.suppliers?.name || 'N/A'}</TableCell>
                        <TableCell>{po.expected_delivery_date || 'N/A'}</TableCell>
                        <TableCell>${po.grand_total}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${
                            po.status === 'delivered' ? 'text-green-600' : 
                            po.status === 'in_transit' ? 'text-blue-600' : 
                            po.status === 'pending' ? 'text-yellow-600' :
                            'text-muted-foreground'
                          }`}>
                            {po.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(po.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(po)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(po)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePrint(po)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
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

      <CreatePOModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchPurchaseOrders}
      />
      <ViewPOModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        purchaseOrder={selectedPO}
      />
    </DashboardLayout>
  );
};

export default PurchaseOrders;