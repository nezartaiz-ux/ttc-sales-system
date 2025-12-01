import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Clock, CheckCircle, Eye, Download, Printer, Trash2, Edit } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateQuotationModal } from "@/components/modals/CreateQuotationModal";
import { ViewQuotationModal } from "@/components/modals/ViewQuotationModal";
import { EditQuotationModal } from "@/components/modals/EditQuotationModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateQuotationPDF, printQuotation } from "@/utils/pdfExport";

const Quotations = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<any>(null);
  const { isAdmin } = useUserRole();
  const { canCreate, canView, canDelete } = useUserPermissions();
  const { toast } = useToast();

  const displayName = (fullName?: string) => {
    if (!fullName) return 'N/A';
    if (fullName.includes('@')) {
      const local = fullName.split('@')[0];
      const words = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return fullName;
  };

  const fetchQuotations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotations')
      .select('*, customers(name), quotation_items(*, inventory_items(name)), profiles!quotations_created_by_fkey(full_name)')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: `Failed to load quotations: ${error.message}`, variant: 'destructive' });
    } else {
      setQuotations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleView = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsViewModalOpen(true);
  };

  const handleEdit = (quotation: any) => {
    setSelectedQuotation(quotation);
    setIsEditModalOpen(true);
  };

  const handleDownloadPDF = (quotation: any) => {
    generateQuotationPDF({
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers?.name || 'N/A',
      validity_period: quotation.validity_period || 'N/A',
      total_amount: quotation.total_amount || 0,
      tax_amount: quotation.tax_amount || 0,
      grand_total: quotation.grand_total || 0,
      items: quotation.quotation_items?.map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      notes: quotation.notes,
      created_by_name: displayName(quotation.profiles?.full_name),
      discount_type: quotation.discount_type,
      discount_value: quotation.discount_value,
      customs_duty_status: quotation.customs_duty_status,
      delivery_terms: quotation.delivery_terms,
      delivery_details: quotation.delivery_details
    });
  };

  const handlePrint = (quotation: any) => {
    printQuotation({
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers?.name || 'N/A',
      validity_period: quotation.validity_period || 'N/A',
      total_amount: quotation.total_amount || 0,
      tax_amount: quotation.tax_amount || 0,
      grand_total: quotation.grand_total || 0,
      items: quotation.quotation_items?.map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      notes: quotation.notes,
      created_by_name: displayName(quotation.profiles?.full_name),
      discount_type: quotation.discount_type,
      discount_value: quotation.discount_value,
      customs_duty_status: quotation.customs_duty_status,
      delivery_terms: quotation.delivery_terms,
      delivery_details: quotation.delivery_details
    });
  };

  const handleDeleteClick = (quotation: any) => {
    if (!isAdmin && !canDelete('quotations')) {
      toast({ title: 'Permission denied', description: 'You do not have permission to delete quotations.', variant: 'destructive' });
      return;
    }
    setQuotationToDelete(quotation);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!quotationToDelete) return;
    
    try {
      const { error } = await supabase
        .from('quotations')
        .delete()
        .eq('id', quotationToDelete.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Quotation deleted successfully' });
      fetchQuotations();
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to delete quotation: ${error.message}`, variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setQuotationToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
            <p className="text-muted-foreground">Manage sales quotations and proposals</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              if (!isAdmin && !canCreate('quotations')) {
                toast({ title: 'Permission denied', description: 'You do not have permission to create quotations.', variant: 'destructive' });
                return;
              }
              setIsCreateModalOpen(true);
            }}
            disabled={!isAdmin && !canCreate('quotations')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Quotation
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotations</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations.length}</div>
              <p className="text-xs text-muted-foreground">All quotations</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations.filter(q => q.status === 'sent').length}</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations.filter(q => q.status === 'accepted').length}</div>
              <p className="text-xs text-muted-foreground">
                {quotations.length > 0 ? Math.round((quotations.filter(q => q.status === 'accepted').length / quotations.length) * 100) : 0}% acceptance rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0) / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">All time value</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quotation Management</CardTitle>
            <CardDescription>All quotations in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading quotations...</div>
            ) : quotations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No quotations found</p>
                <p className="text-sm">Create your first quotation using the button above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quotation #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Grand Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quotation) => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                        <TableCell>{quotation.customers?.name || 'N/A'}</TableCell>
                        <TableCell>{quotation.validity_period || 'N/A'}</TableCell>
                        <TableCell>${quotation.grand_total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <span className={`capitalize ${
                            quotation.status === 'accepted' ? 'text-green-600' : 
                            quotation.status === 'pending' ? 'text-yellow-600' : 
                            'text-muted-foreground'
                          }`}>
                            {quotation.status}
                          </span>
                        </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{displayName(quotation.profiles?.full_name)}</TableCell>
                        <TableCell>{new Date(quotation.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleView(quotation)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(quotation)}
                              disabled={!isAdmin && !canCreate('quotations')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(quotation)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePrint(quotation)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteClick(quotation)}
                              disabled={!isAdmin && !canDelete('quotations')}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      <CreateQuotationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchQuotations}
      />
      <ViewQuotationModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        quotation={selectedQuotation}
      />

      <EditQuotationModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        quotation={selectedQuotation}
        onSuccess={fetchQuotations}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation {quotationToDelete?.quotation_number}? This action cannot be undone.
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

export default Quotations;