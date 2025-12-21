import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileDown, Printer, Pencil } from "lucide-react";
import { format } from "date-fns";
import { generateDeliveryNotePDF, printDeliveryNote } from "@/utils/deliveryNotePdf";

interface ViewDeliveryNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: any;
  onEdit?: () => void;
}

export const ViewDeliveryNoteModal = ({ open, onOpenChange, deliveryNote, onEdit }: ViewDeliveryNoteModalProps) => {
  const getMaterialConditionLabel = (type: string) => {
    switch (type) {
      case 'new':
        return 'New';
      case 'used':
        return 'Used';
      case 'under_warranty':
        return 'Under Warranty';
      default:
        return type;
    }
  };

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

  const handleExportPDF = () => {
    generateDeliveryNotePDF({
      delivery_note_number: deliveryNote.delivery_note_number,
      delivery_note_date: deliveryNote.delivery_note_date,
      customer_name: deliveryNote.customer?.name || '',
      customer_address: deliveryNote.customer_address || '',
      model: deliveryNote.model || '',
      warranty_type: deliveryNote.warranty_type,
      mean_of_despatch: deliveryNote.mean_of_despatch || '',
      mean_number: deliveryNote.mean_number || '',
      driver_name: deliveryNote.driver_name || '',
      created_by_name: deliveryNote.created_by_profile?.full_name || '',
      items: deliveryNote.items?.map((item: any) => ({
        model: item.model || '',
        description: item.description,
        quantity: item.quantity,
        remarks: item.remarks || '',
      })) || [],
    });
  };

  const handlePrint = () => {
    printDeliveryNote({
      delivery_note_number: deliveryNote.delivery_note_number,
      delivery_note_date: deliveryNote.delivery_note_date,
      customer_name: deliveryNote.customer?.name || '',
      customer_address: deliveryNote.customer_address || '',
      model: deliveryNote.model || '',
      warranty_type: deliveryNote.warranty_type,
      mean_of_despatch: deliveryNote.mean_of_despatch || '',
      mean_number: deliveryNote.mean_number || '',
      driver_name: deliveryNote.driver_name || '',
      created_by_name: deliveryNote.created_by_profile?.full_name || '',
      items: deliveryNote.items?.map((item: any) => ({
        model: item.model || '',
        description: item.description,
        quantity: item.quantity,
        remarks: item.remarks || '',
      })) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Delivery Note #{deliveryNote.delivery_note_number}</DialogTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {deliveryNote.delivery_note_date && format(new Date(deliveryNote.delivery_note_date), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p>{getStatusBadge(deliveryNote.status)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{deliveryNote.customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{deliveryNote.customer_address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="font-medium">{deliveryNote.model || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Material Condition</p>
              <p className="font-medium">{getMaterialConditionLabel(deliveryNote.warranty_type)}</p>
            </div>
          </div>

          {/* Dispatching Details */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Dispatching Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mean of Despatch</p>
                <p className="font-medium">{deliveryNote.mean_of_despatch || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Number</p>
                <p className="font-medium">{deliveryNote.mean_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Driver Name</p>
                <p className="font-medium">{deliveryNote.driver_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div>
            <h3 className="font-semibold mb-3">Materials List</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryNote.items?.map((item: any, index: number) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{item.model || '-'}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {deliveryNote.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deliveryNote.notes}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Created by: {deliveryNote.created_by_profile?.full_name || '-'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
