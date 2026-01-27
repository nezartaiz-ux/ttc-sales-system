import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";
import { generateQuotationPDF, printQuotation } from "@/utils/pdfExport";
import tehamaLogo from "@/assets/tehama-logo.png";

interface ViewQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
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

export const ViewQuotationModal = ({ open, onOpenChange, quotation }: ViewQuotationModalProps) => {
  if (!quotation) return null;

  const handleDownloadPDF = () => {
    generateQuotationPDF({
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers?.name || 'N/A',
      validity_period: quotation.validity_period || 'N/A',
      quotation_date: new Date(quotation.created_at).toLocaleDateString('en-CA'),
      total_amount: quotation.total_amount || 0,
      tax_amount: quotation.tax_amount || 0,
      grand_total: quotation.grand_total || 0,
      discount_type: quotation.discount_type || undefined,
      discount_value: quotation.discount_value || undefined,
      customs_duty_status: quotation.customs_duty_status || undefined,
      delivery_terms: quotation.delivery_terms || undefined,
      delivery_details: quotation.delivery_details || undefined,
      items: (quotation.quotation_items || []).map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      notes: quotation.notes,
      created_by_name: displayName(quotation.profiles?.full_name)
    });
  };

  const handlePrint = () => {
    printQuotation({
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers?.name || 'N/A',
      validity_period: quotation.validity_period || 'N/A',
      quotation_date: new Date(quotation.created_at).toLocaleDateString('en-CA'),
      total_amount: quotation.total_amount || 0,
      tax_amount: quotation.tax_amount || 0,
      grand_total: quotation.grand_total || 0,
      discount_type: quotation.discount_type || undefined,
      discount_value: quotation.discount_value || undefined,
      customs_duty_status: quotation.customs_duty_status || undefined,
      delivery_terms: quotation.delivery_terms || undefined,
      delivery_details: quotation.delivery_details || undefined,
      items: (quotation.quotation_items || []).map((item: any) => ({
        name: item.inventory_items?.name || 'N/A',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      notes: quotation.notes,
      created_by_name: displayName(quotation.profiles?.full_name)
    });
  };

  // Calculate discount
  const discountAmount = (quotation.discount_value && quotation.discount_value > 0)
    ? (quotation.discount_type === 'percentage'
      ? (quotation.total_amount * quotation.discount_value / 100)
      : quotation.discount_value)
    : 0;
  const netAmount = quotation.total_amount - discountAmount;

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
          <h1 className="text-center text-xl font-bold my-4">QUOTATION</h1>

          {/* Details */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 text-sm">
            <div className="flex gap-2">
              <span className="font-bold">Quotation #:</span>
              <span>{quotation.quotation_number}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <span className="font-bold">Quotation Date:</span>
              <span>{new Date(quotation.created_at).toLocaleDateString('en-CA')}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold">Customer:</span>
              <span>{quotation.customers?.name || 'N/A'}</span>
            </div>
            <div></div>
            {quotation.delivery_terms && (
              <>
                <div className="flex gap-2 col-span-2">
                  <span className="font-bold">Delivery Terms:</span>
                  <span>{quotation.delivery_terms}</span>
                </div>
              </>
            )}
            {quotation.delivery_details && (
              <>
                <div className="flex gap-2 col-span-2">
                  <span className="font-bold">Delivery Details:</span>
                  <span>{quotation.delivery_details}</span>
                </div>
              </>
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
              {quotation.quotation_items?.map((item: any) => (
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
            <p><span className="font-bold">Value:</span> {formatCurrency(quotation.total_amount)}</p>
            {quotation.discount_value && quotation.discount_value > 0 && (
              <>
                <p>
                  <span className="font-bold">
                    {quotation.discount_type === 'percentage' 
                      ? `Given Discount (${quotation.discount_value}%):` 
                      : 'Given Discount:'}
                  </span> -{formatCurrency(discountAmount)}
                </p>
                <p><span className="font-bold">Net Amount:</span> {formatCurrency(netAmount)}</p>
              </>
            )}
            <p><span className="font-bold">{quotation.customs_duty_status === 'DDP Aden' || quotation.customs_duty_status === "DDP Sana'a" ? 'Customs Duty & Sales Tax:' : 'Tax:'}</span> {formatCurrency(quotation.tax_amount)}</p>
            <p className="text-base"><span className="font-bold">Grand Total:</span> {formatCurrency(quotation.grand_total)}</p>
          </div>

          {/* Amount in Words */}
          <div className="mb-4 text-sm">
            <span className="font-bold">Amount in Words:</span>
            <span className="ml-2">{amountToWords(quotation.grand_total)}</span>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="text-xs leading-relaxed mb-6 whitespace-pre-wrap">
              {quotation.notes.split('\n').map((line: string, index: number) => {
                const trimmed = line.trim();
                const isHeader = (trimmed.endsWith(':') && trimmed.length < 50) || 
                               (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60);
                return (
                  <div key={index} className={isHeader ? 'font-bold mt-2' : ''}>
                    {trimmed || <br />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Signature Section */}
          <div className="text-right mt-8 pr-8">
            <p className="text-sm mb-1">Prepared by:</p>
            {quotation.profiles?.full_name && (
              <p className="font-bold text-sm mb-4">{displayName(quotation.profiles.full_name)}</p>
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