import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, Download, Trash2, Eye, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UploadDatasheetModal } from "@/components/modals/UploadDatasheetModal";
import { useUserCategories } from "@/hooks/useUserCategories";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DatasheetCategory = 'generator' | 'equipment' | 'tractor';

interface Datasheet {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  inventory_item_id: string | null;
  uploaded_by: string;
  created_at: string;
  inventory_items: { name: string; category_id: string } | null;
}

const TechnicalDatasheets = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DatasheetCategory>('generator');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userCategories, hasRestrictions, getCategoryIds, loading: categoriesLoading } = useUserCategories();

  const { data: datasheets = [], isLoading } = useQuery({
    queryKey: ['technical-datasheets', hasRestrictions, userCategories],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technical_datasheets')
        .select(`
          *,
          inventory_items (name, category_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Datasheet[];
    },
    enabled: !categoriesLoading,
  });

  // Get allowed categories based on user's product categories
  const allowedCategories = useMemo(() => {
    if (!hasRestrictions) return ['generator', 'equipment', 'tractor'];
    
    const categoryNames = userCategories.map(c => c.name.toLowerCase());
    const allowed: string[] = [];
    
    categoryNames.forEach(name => {
      if (name.includes('generator') || name.includes('مولد')) allowed.push('generator');
      if (name.includes('equipment') || name.includes('معد')) allowed.push('equipment');
      if (name.includes('tractor') || name.includes('حراث')) allowed.push('tractor');
    });
    
    return [...new Set(allowed)];
  }, [userCategories, hasRestrictions]);

  // Filter datasheets by user's categories
  const accessibleDatasheets = useMemo(() => {
    if (!hasRestrictions) return datasheets;
    const categoryIds = getCategoryIds();
    // Filter by linked inventory item's category OR by the datasheet's own category if no item linked
    return datasheets.filter(d => {
      if (d.inventory_items?.category_id) {
        return categoryIds.includes(d.inventory_items.category_id);
      }
      // If no inventory item linked, show it
      return true;
    });
  }, [datasheets, hasRestrictions, getCategoryIds]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const datasheet = datasheets.find(d => d.id === id);
      if (!datasheet) throw new Error('Datasheet not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('datasheets')
        .remove([datasheet.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('technical_datasheets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-datasheets'] });
      toast({
        title: "Success",
        description: "Datasheet deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleView = async (filePath: string, name: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('datasheets')
        .download(filePath);

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to open file",
          variant: "destructive",
        });
        return;
      }

      // Create a blob with explicit PDF MIME type for proper iframe rendering
      const pdfBlob = new Blob([data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(pdfBlob);
      setViewingPdf({ url: fileURL, name });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive",
      });
    }
  };

  const handleClosePdfViewer = () => {
    if (viewingPdf) {
      URL.revokeObjectURL(viewingPdf.url);
      setViewingPdf(null);
    }
  };

  const handleDownload = async (filePath: string, name: string) => {
    const { data, error } = await supabase.storage
      .from('datasheets')
      .download(filePath);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Set default category based on allowed categories
  const defaultCategory = useMemo(() => {
    if (allowedCategories.includes(selectedCategory)) return selectedCategory;
    return (allowedCategories[0] as DatasheetCategory) || 'generator';
  }, [allowedCategories, selectedCategory]);

  const filteredDatasheets = accessibleDatasheets;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Technical Datasheets</h1>
            <p className="text-muted-foreground">
              Manage technical catalogs for generators, equipment, and tractors
            </p>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Datasheet
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catalog Library</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={defaultCategory} onValueChange={(v) => setSelectedCategory(v as DatasheetCategory)}>
              <TabsList className={`grid w-full grid-cols-${allowedCategories.length || 3}`}>
                {(!hasRestrictions || allowedCategories.includes('generator')) && (
                  <TabsTrigger value="generator">Generators</TabsTrigger>
                )}
                {(!hasRestrictions || allowedCategories.includes('equipment')) && (
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                )}
                {(!hasRestrictions || allowedCategories.includes('tractor')) && (
                  <TabsTrigger value="tractor">Tractors</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value={defaultCategory} className="mt-6">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : filteredDatasheets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No datasheets found for this category
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Linked Item</TableHead>
                        <TableHead>File Size</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDatasheets.map((datasheet) => (
                        <TableRow key={datasheet.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              {datasheet.file_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {datasheet.inventory_items?.name || '-'}
                          </TableCell>
                          <TableCell>{formatFileSize(datasheet.file_size)}</TableCell>
                          <TableCell>
                            {new Date(datasheet.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleView(datasheet.file_path, datasheet.file_name)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(datasheet.file_path, datasheet.file_name)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteId(datasheet.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <UploadDatasheetModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Datasheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this datasheet? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Viewer Modal */}
      <Dialog open={!!viewingPdf} onOpenChange={handleClosePdfViewer}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle>{viewingPdf?.name}</DialogTitle>
              <div className="flex gap-2">
                {viewingPdf && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = viewingPdf.url;
                      a.download = viewingPdf.name + '.pdf';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewingPdf && (
              <iframe
                src={viewingPdf.url}
                className="w-full h-full border-0"
                title={viewingPdf.name}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default TechnicalDatasheets;