import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, FileDown, Eye, Trash2, Truck, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CreateDeliveryNoteModal } from "@/components/modals/CreateDeliveryNoteModal";
import { ViewDeliveryNoteModal } from "@/components/modals/ViewDeliveryNoteModal";
import { EditDeliveryNoteModal } from "@/components/modals/EditDeliveryNoteModal";
import { useUserCategories } from "@/hooks/useUserCategories";
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

const DeliveryNotes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getCategoryIds, hasRestrictions, loading: categoriesLoading } = useUserCategories();

  const { data: deliveryNotes, isLoading } = useQuery({
    queryKey: ['delivery-notes', hasRestrictions, categoriesLoading],
    queryFn: async () => {
      const categoryIds = getCategoryIds();
      
      // First get delivery notes
      const { data: notes, error } = await supabase
        .from('delivery_notes')
        .select(`
          *,
          customer:customers(name),
          created_by_profile:profiles!delivery_notes_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!notes) return [];

      // If user has category restrictions, filter delivery notes by items' categories
      if (hasRestrictions && categoryIds.length > 0) {
        // Get all delivery note items with their inventory items
        const noteIds = notes.map(n => n.id);
        const { data: items } = await supabase
          .from('delivery_note_items')
          .select('delivery_note_id, inventory_item_id, inventory_items(category_id)')
          .in('delivery_note_id', noteIds);
        
        // Filter notes that have at least one item from user's categories
        const validNoteIds = new Set<string>();
        items?.forEach(item => {
          const categoryId = (item as any).inventory_items?.category_id;
          if (categoryId && categoryIds.includes(categoryId)) {
            validNoteIds.add(item.delivery_note_id);
          }
        });
        
        return notes.filter(n => validNoteIds.has(n.id));
      }

      return notes;
    },
    enabled: !categoriesLoading
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast({
        title: "Deleted",
        description: "Delivery note deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleView = async (note: any) => {
    const { data: items, error } = await supabase
      .from('delivery_note_items')
      .select(`
        *,
        inventory_item:inventory_items(name)
      `)
      .eq('delivery_note_id', note.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load delivery note items",
        variant: "destructive",
      });
      return;
    }

    setSelectedNote({ ...note, items });
    setIsViewModalOpen(true);
  };

  const handleEdit = async (note: any) => {
    const { data: items, error } = await supabase
      .from('delivery_note_items')
      .select('*')
      .eq('delivery_note_id', note.id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load delivery note items",
        variant: "destructive",
      });
      return;
    }

    setSelectedNote({ ...note, items });
    setIsEditModalOpen(true);
  };

  const filteredNotes = deliveryNotes?.filter(note =>
    note.delivery_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Delivery Notes</h1>
            <p className="text-muted-foreground mt-1">Manage delivery notes</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Delivery Note
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveryNotes?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {deliveryNotes?.filter(n => n.status === 'sent').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {deliveryNotes?.filter(n => n.status === 'delivered').length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Delivery Notes List
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredNotes?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No delivery notes found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotes?.map((note) => (
                      <TableRow key={note.id}>
                        <TableCell className="font-medium">{note.delivery_note_number}</TableCell>
                        <TableCell>
                          {note.delivery_date && format(new Date(note.delivery_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{note.customer?.name}</TableCell>
                        <TableCell>{getStatusBadge(note.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleView(note)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(note)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(note.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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

      <CreateDeliveryNoteModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {selectedNote && (
        <ViewDeliveryNoteModal
          open={isViewModalOpen}
          onOpenChange={setIsViewModalOpen}
          deliveryNote={selectedNote}
          onEdit={() => {
            setIsViewModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {selectedNote && (
        <EditDeliveryNoteModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          deliveryNote={selectedNote}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this delivery note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DeliveryNotes;
