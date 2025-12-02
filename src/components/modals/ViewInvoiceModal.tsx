import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer } from "lucide-react";
import { generateInvoicePDF, printInvoice } from "@/utils/pdfExport";

interface ViewInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
}

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

export const ViewInvoiceModal = ({ open, onOpenChange, invoice }: ViewInvoiceModalProps) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details - {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{invoice.customers?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{invoice.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{invoice.invoice_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{invoice.due_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created By</p>
              <p className="font-medium">{invoice.profiles?.full_name || 'N/A'}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.sales_invoice_items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.inventory_items?.name || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unit_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>${item.total_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 text-right">
            <p><span className="text-muted-foreground">Subtotal:</span> <span className="font-semibold">${invoice.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            <p><span className="text-muted-foreground">Tax:</span> <span className="font-semibold">${invoice.tax_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
            <p className="text-lg"><span className="text-muted-foreground">Grand Total:</span> <span className="font-bold">${invoice.grand_total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleDownloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
