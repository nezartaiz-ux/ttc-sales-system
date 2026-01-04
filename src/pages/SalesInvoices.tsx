import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, DollarSign, CreditCard, Eye, Trash2, FileDown, Printer, Truck } from "lucide-react";
import { generateInvoicePDF, printInvoice } from "@/utils/pdfExport";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateInvoiceModal } from "@/components/modals/CreateInvoiceModal";
import { ViewInvoiceModal } from "@/components/modals/ViewInvoiceModal";
import { CreateDeliveryNoteModal } from "@/components/modals/CreateDeliveryNoteModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useUserCategories } from "@/hooks/useUserCategories";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const SalesInvoices = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false);
  const [invoiceForDeliveryNote, setInvoiceForDeliveryNote] = useState<any>(null);
  const { isAdmin } = useUserRole();
  const { canCreate, canDelete } = useUserPermissions();
  const { userCategories, hasRestrictions, loading: categoriesLoading } = useUserCategories();
  const { toast } = useToast();

  const canCreateInvoice = isAdmin || canCreate('sales_invoices');

  const fetchInvoices = async () => {
    if (categoriesLoading) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          customers(name, address),
          profiles(full_name),
          sales_invoice_items(
            *,
            inventory_items(name, category_id)
          ),
          delivery_notes(id, delivery_note_number, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter invoices based on user's category access
      let filteredData = data || [];
      if (hasRestrictions && userCategories.length > 0) {
        const categoryIds = userCategories.map(c => c.id);
        // Keep invoices that have at least one item in user's categories
        filteredData = filteredData.filter(inv => {
          const items = inv.sales_invoice_items || [];
          return items.some((item: any) => categoryIds.includes(item.inventory_items?.category_id));
        });
      }
      setInvoices(filteredData);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch invoices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!categoriesLoading) {
      fetchInvoices();
    }
  }, [categoriesLoading, userCategories]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'draft': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDeleteClick = (invoice: any) => {
    if (!isAdmin && !canDelete('sales_invoices')) {
      toast({ title: 'Permission denied', description: 'You do not have permission to delete invoices.', variant: 'destructive' });
      return;
    }
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    
    try {
      const { error } = await supabase
        .from('sales_invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Invoice deleted successfully' });
      fetchInvoices();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to delete invoice: ${error.message}`, variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const displayName = (name: string | null | undefined): string => {
    if (!name) return 'N/A';
    if (name === 'nezartaiz@gmail.com' || name.toLowerCase().includes('nezartaiz')) return 'Nezar';
    if (name.includes('@')) {
      const localPart = name.split('@')[0];
      return localPart.split('.').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    return name;
  };

  const handlePDF = (invoice: any) => {
    const items = invoice.sales_invoice_items?.map((item: any) => ({
      name: item.inventory_items?.name || 'Unknown Item',
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price),
    })) || [];

    generateInvoicePDF({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customers?.name || 'N/A',
      invoice_type: invoice.invoice_type,
      due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A',
      total_amount: parseFloat(invoice.total_amount),
      tax_amount: parseFloat(invoice.tax_amount),
      grand_total: parseFloat(invoice.grand_total),
      items,
      notes: invoice.notes,
      created_by_name: displayName(invoice.profiles?.full_name),
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value ? parseFloat(invoice.discount_value) : undefined,
      customs_duty_status: invoice.customs_duty_status,
    });
  };

  const handlePrint = (invoice: any) => {
    const items = invoice.sales_invoice_items?.map((item: any) => ({
      name: item.inventory_items?.name || 'Unknown Item',
      quantity: item.quantity,
      unit_price: parseFloat(item.unit_price),
      total_price: parseFloat(item.total_price),
    })) || [];

    printInvoice({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customers?.name || 'N/A',
      invoice_type: invoice.invoice_type,
      due_date: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A',
      total_amount: parseFloat(invoice.total_amount),
      tax_amount: parseFloat(invoice.tax_amount),
      grand_total: parseFloat(invoice.grand_total),
      items,
      notes: invoice.notes,
      created_by_name: displayName(invoice.profiles?.full_name),
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value ? parseFloat(invoice.discount_value) : undefined,
      customs_duty_status: invoice.customs_duty_status,
    });
  };

  const handleCreateDeliveryNote = (invoice: any) => {
    setInvoiceForDeliveryNote(invoice);
    setIsDeliveryNoteModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Invoices</h1>
            <p className="text-muted-foreground">Manage billing and payments</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              if (!canCreateInvoice) {
                toast({ title: 'Permission denied', description: 'You do not have permission to create invoices.', variant: 'destructive' });
                return;
              }
              setIsCreateModalOpen(true);
            }}
            disabled={!canCreateInvoice}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.length}</div>
              <p className="text-xs text-muted-foreground">All invoices</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'paid').length}</div>
              <p className="text-xs text-muted-foreground">
                {invoices.length > 0 ? Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100) : 0}% payment rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <CreditCard className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices.filter(inv => inv.status === 'draft').length}</div>
              <p className="text-xs text-muted-foreground">Not yet sent</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.grand_total || 0), 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">Paid invoices</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>View and manage all sales invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No invoices yet</p>
                <p className="text-sm">Create your first invoice to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const deliveryNote = invoice.delivery_notes?.[0];
                    const deliveryStatus = deliveryNote?.status;
                    return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customers?.name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{invoice.invoice_type}</TableCell>
                      <TableCell>${parseFloat(invoice.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {deliveryNote ? (
                          <Badge 
                            variant={deliveryStatus === 'delivered' ? 'default' : deliveryStatus === 'cancelled' ? 'destructive' : 'outline'}
                            className={deliveryStatus === 'delivered' ? 'bg-green-500' : ''}
                          >
                            {deliveryStatus === 'pending' ? 'قيد الانتظار' : deliveryStatus === 'delivered' ? 'تم التسليم' : 'ملغاة'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{displayName(invoice.profiles?.full_name)}</TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsViewModalOpen(true);
                            }}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePDF(invoice)}
                            title="Download PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handlePrint(invoice)}
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleCreateDeliveryNote(invoice)}
                            title="Create Delivery Note"
                          >
                            <Truck className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteClick(invoice)}
                            disabled={!isAdmin && !canDelete('sales_invoices')}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateInvoiceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={() => {
          fetchInvoices();
        }}
      />

      <ViewInvoiceModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        invoice={selectedInvoice}
        onCreateDeliveryNote={handleCreateDeliveryNote}
      />

      <CreateDeliveryNoteModal
        open={isDeliveryNoteModalOpen}
        onOpenChange={(open) => {
          setIsDeliveryNoteModalOpen(open);
          if (!open) setInvoiceForDeliveryNote(null);
        }}
        importFromInvoice={invoiceForDeliveryNote}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.invoice_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default SalesInvoices;