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
import { FileDown, Printer } from "lucide-react";
import { format } from "date-fns";
import { generateDeliveryNotePDF, printDeliveryNote } from "@/utils/deliveryNotePdf";

interface ViewDeliveryNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: any;
}

export const ViewDeliveryNoteModal = ({ open, onOpenChange, deliveryNote }: ViewDeliveryNoteModalProps) => {
  const getWarrantyTypeLabel = (type: string) => {
    switch (type) {
      case 'under_warranty':
        return 'تحت الضمان';
      case 'out_of_warranty':
        return 'خارج الضمان';
      case 'new_sale':
        return 'بيع جديد';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">قيد الانتظار</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">تم التسليم</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغاة</Badge>;
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
      warranty_type: getWarrantyTypeLabel(deliveryNote.warranty_type),
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
      warranty_type: getWarrantyTypeLabel(deliveryNote.warranty_type),
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
            <DialogTitle>وثيقة التسليم #{deliveryNote.delivery_note_number}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                طباعة
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
              <p className="text-sm text-muted-foreground">التاريخ</p>
              <p className="font-medium">
                {deliveryNote.delivery_note_date && format(new Date(deliveryNote.delivery_note_date), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحالة</p>
              <p>{getStatusBadge(deliveryNote.status)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">العميل</p>
              <p className="font-medium">{deliveryNote.customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">عنوان التسليم</p>
              <p className="font-medium">{deliveryNote.customer_address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الموديل</p>
              <p className="font-medium">{deliveryNote.model || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">نوع الضمان</p>
              <p className="font-medium">{getWarrantyTypeLabel(deliveryNote.warranty_type)}</p>
            </div>
          </div>

          {/* Dispatching Details */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">تفاصيل الإرسال</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">وسيلة الإرسال</p>
                <p className="font-medium">{deliveryNote.mean_of_despatch || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رقم الوسيلة</p>
                <p className="font-medium">{deliveryNote.mean_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اسم السائق</p>
                <p className="font-medium">{deliveryNote.driver_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div>
            <h3 className="font-semibold mb-3">قائمة المواد</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>الموديل</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="w-20">الكمية</TableHead>
                  <TableHead>ملاحظات</TableHead>
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
              <h3 className="font-semibold mb-2">ملاحظات</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{deliveryNote.notes}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>تم الإنشاء بواسطة: {deliveryNote.created_by_profile?.full_name || '-'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
