import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown, Printer, Pencil, X } from "lucide-react";
import { format } from "date-fns";
import { generateDeliveryNotePDF, printDeliveryNote } from "@/utils/deliveryNotePdf";
import tehamaLogo from "@/assets/tehama-logo.png";

interface ViewDeliveryNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: any;
  onEdit?: () => void;
}

const COMPANY_INFO = {
  name: "Tehama Trading Company",
  address: "Sana'a Regional Office",
  footer: {
    postBox: "Post Box: 73",
    location: "Sana'a, Yemen",
    phone: "Phone: 967 1 208916/400266",
    fax: "Fax: 967 1 466056"
  }
};

const getMaterialConditionLabel = (type: string) => {
  switch (type) {
    case 'new':
    case 'new_sale':
      return 'New';
    case 'used':
    case 'out_of_warranty':
      return 'Used';
    case 'under_warranty':
      return 'Under Warranty';
    default:
      return type;
  }
};

export const ViewDeliveryNoteModal = ({ open, onOpenChange, deliveryNote, onEdit }: ViewDeliveryNoteModalProps) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Action Buttons */}
        <div className="sticky top-0 z-10 bg-background border-b p-3 flex justify-between items-center">
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
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF-like Preview */}
        <div className="bg-white text-black p-8 min-h-[800px]" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-base m-0">{COMPANY_INFO.name}</h3>
              <p className="text-xs text-gray-600 m-0">{COMPANY_INFO.address}</p>
            </div>
            <img src={tehamaLogo} alt="Logo" className="w-28 h-auto" />
          </div>

          {/* Title */}
          <h1 className="text-center text-xl font-bold my-4">MATERIALS DELIVERY NOTE</h1>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">DN #:</span>
              <span>{deliveryNote.delivery_note_number}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Date:</span>
              <span>{deliveryNote.delivery_note_date && format(new Date(deliveryNote.delivery_note_date), 'dd/MM/yyyy')}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Customer:</span>
              <span>{deliveryNote.customer?.name || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Address:</span>
              <span>{deliveryNote.customer_address || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Model:</span>
              <span>{deliveryNote.model || '-'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Material Condition:</span>
              <span>{getMaterialConditionLabel(deliveryNote.warranty_type)}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-4 text-sm">
            <thead>
              <tr className="bg-gray-700 text-white">
                <th className="border border-gray-300 p-2 text-left font-bold w-10">#</th>
                <th className="border border-gray-300 p-2 text-left font-bold w-24">Model</th>
                <th className="border border-gray-300 p-2 text-left font-bold">Description</th>
                <th className="border border-gray-300 p-2 text-left font-bold w-12">Qty</th>
                <th className="border border-gray-300 p-2 text-left font-bold w-28">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {deliveryNote.items?.map((item: any, index: number) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2">{index + 1}</td>
                  <td className="border border-gray-300 p-2">{item.model || '-'}</td>
                  <td className="border border-gray-300 p-2">{item.description}</td>
                  <td className="border border-gray-300 p-2">{item.quantity}</td>
                  <td className="border border-gray-300 p-2">{item.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Dispatching Details */}
          <div className="border rounded p-3 mb-4">
            <p className="font-bold text-sm mb-2">Dispatching Details:</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Mean of Despatch:</span>
                <span className="ml-2">{deliveryNote.mean_of_despatch || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">Vehicle #:</span>
                <span className="ml-2">{deliveryNote.mean_number || '-'}</span>
              </div>
              <div>
                <span className="text-gray-600">Driver:</span>
                <span className="ml-2">{deliveryNote.driver_name || '-'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {deliveryNote.notes && (
            <div className="text-xs leading-relaxed mb-6">
              <p className="font-bold mb-1">Notes:</p>
              <p className="whitespace-pre-wrap">{deliveryNote.notes}</p>
            </div>
          )}

          {/* Signature Section - 3 columns */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <p className="text-sm font-bold mb-1">Prepared by:</p>
              <p className="text-sm mb-4">{deliveryNote.created_by_profile?.full_name || ''}</p>
              <div className="border-t border-black pt-1 text-xs mx-4">Signature</div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold mb-1">Received by:</p>
              <p className="text-sm mb-4">{deliveryNote.customer?.name || ''}</p>
              <div className="border-t border-black pt-1 text-xs mx-4">Signature</div>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold mb-1">Driver:</p>
              <p className="text-sm mb-4">{deliveryNote.driver_name || '_______________'}</p>
              <div className="border-t border-black pt-1 text-xs mx-4">Signature</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-3 border-t text-center text-xs text-gray-500">
            {COMPANY_INFO.footer.postBox} | {COMPANY_INFO.footer.location} | {COMPANY_INFO.footer.phone} | {COMPANY_INFO.footer.fax}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};