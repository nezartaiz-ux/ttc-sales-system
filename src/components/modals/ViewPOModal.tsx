import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";
import { generatePOPDF, printPO } from "@/utils/pdfExport";
import tehamaLogo from "@/assets/tehama-logo.png";

interface ViewPOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: any;
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

const displayName = (fullName?: string) => {
  if (!fullName) return 'N/A';
  if (fullName === 'nezartaiz@gmail.com') return 'Nezar';
  if (fullName.includes('@')) {
    const local = fullName.split('@')[0];
    const words = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return fullName;
};

const formatCurrency = (amount: number): string => {
  return '$' + amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const ViewPOModal = ({ open, onOpenChange, purchaseOrder }: ViewPOModalProps) => {
  if (!purchaseOrder) return null;

  const handleDownloadPDF = () => {
    generatePOPDF({
      order_number: purchaseOrder.order_number,
      supplier_name: purchaseOrder.suppliers?.name || 'N/A',
      expected_delivery_date: purchaseOrder.expected_delivery_date || 'N/A',
      total_amount: purchaseOrder.total_amount || 0,
      tax_amount: purchaseOrder.tax_amount || 0,
      grand_total: purchaseOrder.grand_total || 0,
      items: purchaseOrder.purchase_order_items || [],
      notes: purchaseOrder.notes,
      created_by_name: displayName(purchaseOrder.profiles?.full_name),
      customs_duty_status: purchaseOrder.customs_duty_status
    });
  };

  const handlePrint = () => {
    printPO({
      order_number: purchaseOrder.order_number,
      supplier_name: purchaseOrder.suppliers?.name || 'N/A',
      expected_delivery_date: purchaseOrder.expected_delivery_date || 'N/A',
      total_amount: purchaseOrder.total_amount || 0,
      tax_amount: purchaseOrder.tax_amount || 0,
      grand_total: purchaseOrder.grand_total || 0,
      items: purchaseOrder.purchase_order_items || [],
      notes: purchaseOrder.notes,
      created_by_name: displayName(purchaseOrder.profiles?.full_name),
      customs_duty_status: purchaseOrder.customs_duty_status
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Action Buttons */}
        <div className="sticky top-0 z-10 bg-background border-b p-3 flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
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
          <h1 className="text-center text-xl font-bold my-4">PURCHASE ORDER</h1>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">PO #:</span>
              <span>{purchaseOrder.order_number}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Expected Delivery:</span>
              <span>{purchaseOrder.expected_delivery_date || 'N/A'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Supplier:</span>
              <span>{purchaseOrder.suppliers?.name || 'N/A'}</span>
            </div>
            {purchaseOrder.customs_duty_status && (
              <div className="flex gap-2">
                <span className="font-bold">Customs:</span>
                <span>{purchaseOrder.customs_duty_status}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-4 text-sm">
            <thead>
              <tr className="bg-gray-700 text-white">
                <th className="border border-gray-300 p-2 text-left font-bold">Item</th>
                <th className="border border-gray-300 p-2 text-left font-bold w-16">Qty</th>
                <th className="border border-gray-300 p-2 text-left font-bold w-24">Unit Price</th>
                <th className="border border-gray-300 p-2 text-left font-bold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrder.purchase_order_items?.map((item: any) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2">{item.inventory_items?.name || 'N/A'}</td>
                  <td className="border border-gray-300 p-2">{item.quantity.toLocaleString()}</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(item.unit_price)}</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="text-right text-sm space-y-1 mb-4">
            <p><span className="font-bold">Subtotal:</span> {formatCurrency(purchaseOrder.total_amount)}</p>
            <p><span className="font-bold">{purchaseOrder.customs_duty_status === 'DDP Aden' || purchaseOrder.customs_duty_status === "DDP Sana'a" ? 'Customs Duty & Sales Tax:' : 'Tax:'}</span> {formatCurrency(purchaseOrder.tax_amount)}</p>
            <p className="text-base"><span className="font-bold">Grand Total:</span> {formatCurrency(purchaseOrder.grand_total)}</p>
          </div>

          {/* Notes */}
          {purchaseOrder.notes && (
            <div className="text-xs leading-relaxed mb-6">
              <p className="font-bold mb-1">Notes:</p>
              <p className="whitespace-pre-wrap">{purchaseOrder.notes}</p>
            </div>
          )}

          {/* Signature Section */}
          <div className="text-right mt-8 pr-8">
            <p className="text-sm mb-1">Prepared by:</p>
            {purchaseOrder.profiles?.full_name && (
              <p className="font-bold text-sm mb-4">{displayName(purchaseOrder.profiles.full_name)}</p>
            )}
            <div className="w-48 border-t border-black ml-auto pt-1 text-xs text-center">
              Signature
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