import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Truck, X } from "lucide-react";
import { generateInvoicePDF, printInvoice } from "@/utils/pdfExport";
import tehamaLogo from "@/assets/tehama-logo.png";

interface ViewInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onCreateDeliveryNote?: (invoice: any) => void;
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

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  let word = '';
  let i = 0;
  
  while (num > 0) {
    if (num % 1000 !== 0) {
      word = convertLessThanThousand(num % 1000) + (thousands[i] !== '' ? ' ' + thousands[i] : '') + (word !== '' ? ' ' + word : '');
    }
    num = Math.floor(num / 1000);
    i++;
  }

  return word.trim();
};

const amountToWords = (amount: number): string => {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);
  
  let result = numberToWords(dollars) + ' Dollar' + (dollars !== 1 ? 's' : '');
  
  if (cents > 0) {
    result += ' and ' + numberToWords(cents) + ' Cent' + (cents !== 1 ? 's' : '');
  }
  
  return result;
};

export const ViewInvoiceModal = ({ open, onOpenChange, invoice, onCreateDeliveryNote }: ViewInvoiceModalProps) => {
  if (!invoice) return null;

  const handleDownloadPDF = () => {
    generateInvoicePDF({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customers?.name || 'N/A',
      invoice_type: invoice.invoice_type,
      due_date: invoice.due_date || 'N/A',
      total_amount: invoice.total_amount || 0,
      tax_amount: invoice.tax_amount || 0,
      grand_total: invoice.grand_total || 0,
      items: invoice.sales_invoice_items?.map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      notes: invoice.notes,
      created_by_name: displayName(invoice.profiles?.full_name),
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value,
      customs_duty_status: invoice.customs_duty_status
    });
  };

  const handlePrint = () => {
    printInvoice({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customers?.name || 'N/A',
      invoice_type: invoice.invoice_type,
      due_date: invoice.due_date || 'N/A',
      total_amount: invoice.total_amount || 0,
      tax_amount: invoice.tax_amount || 0,
      grand_total: invoice.grand_total || 0,
      items: invoice.sales_invoice_items?.map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [],
      notes: invoice.notes,
      created_by_name: displayName(invoice.profiles?.full_name),
      discount_type: invoice.discount_type,
      discount_value: invoice.discount_value,
      customs_duty_status: invoice.customs_duty_status
    });
  };

  const handleCreateDeliveryNote = () => {
    if (onCreateDeliveryNote) {
      onCreateDeliveryNote(invoice);
      onOpenChange(false);
    }
  };

  // Calculate discount
  const discountAmount = (invoice.discount_value && invoice.discount_value > 0)
    ? (invoice.discount_type === 'percentage'
      ? (invoice.total_amount * invoice.discount_value / 100)
      : invoice.discount_value)
    : 0;
  const netAmount = invoice.total_amount - discountAmount;

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
            {onCreateDeliveryNote && (
              <Button onClick={handleCreateDeliveryNote} variant="default" size="sm">
                <Truck className="h-4 w-4 mr-2" />
                إنشاء وثيقة تسليم
              </Button>
            )}
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
          <h1 className="text-center text-xl font-bold my-4">SALES INVOICE</h1>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">Invoice #:</span>
              <span>{invoice.invoice_number}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Due Date:</span>
              <span>{invoice.due_date || 'N/A'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Customer:</span>
              <span>{invoice.customers?.name || 'N/A'}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Type:</span>
              <span className="uppercase">{invoice.invoice_type}</span>
            </div>
            {invoice.customs_duty_status && (
              <div className="flex gap-2 col-span-2">
                <span className="font-bold">Customs:</span>
                <span>{invoice.customs_duty_status}</span>
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
              {invoice.sales_invoice_items?.map((item: any) => (
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
            <p><span className="font-bold">Value:</span> {formatCurrency(invoice.total_amount)}</p>
            {invoice.discount_value && invoice.discount_value > 0 && (
              <>
                <p>
                  <span className="font-bold">
                    {invoice.discount_type === 'percentage' 
                      ? `Discount (${invoice.discount_value}%):` 
                      : 'Discount:'}
                  </span> -{formatCurrency(discountAmount)}
                </p>
                <p><span className="font-bold">Net Amount:</span> {formatCurrency(netAmount)}</p>
              </>
            )}
            <p><span className="font-bold">Tax:</span> {formatCurrency(invoice.tax_amount)}</p>
            <p className="text-base"><span className="font-bold">Grand Total:</span> {formatCurrency(invoice.grand_total)}</p>
          </div>

          {/* Amount in Words */}
          <div className="mb-4 text-sm">
            <span className="font-bold">Amount in Words:</span>
            <span className="ml-2">{amountToWords(invoice.grand_total)}</span>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="text-xs leading-relaxed mb-6">
              <p className="font-bold mb-1">Notes:</p>
              <p className="whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Signature Section */}
          <div className="text-right mt-8 pr-8">
            <p className="text-sm mb-1">Prepared by:</p>
            {invoice.profiles?.full_name && (
              <p className="font-bold text-sm mb-4">{displayName(invoice.profiles.full_name)}</p>
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