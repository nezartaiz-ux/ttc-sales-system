import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer } from "lucide-react";
import { generateQuotationPDF, printQuotation } from "@/utils/pdfExport";

interface ViewQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
}

export const ViewQuotationModal = ({ open, onOpenChange, quotation }: ViewQuotationModalProps) => {
  if (!quotation) return null;

  const handleDownloadPDF = () => {
    generateQuotationPDF({
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers?.name || 'N/A',
      validity_period: quotation.validity_period || 'N/A',
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
      created_by_name: quotation.profiles?.full_name || 'N/A'
    });
  };

  const handlePrint = () => {
    printQuotation({
      quotation_number: quotation.quotation_number,
      customer_name: quotation.customers?.name || 'N/A',
      validity_period: quotation.validity_period || 'N/A',
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
      created_by_name: quotation.profiles?.full_name || 'N/A'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quotation Details - {quotation.quotation_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{quotation.customers?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{quotation.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Until</p>
              <p className="font-medium">{quotation.validity_period || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(quotation.created_at).toLocaleDateString()}</p>
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
                {quotation.quotation_items?.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.inventory_items?.name || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unit_price}</TableCell>
                    <TableCell>${item.total_price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 text-right">
            <p><span className="text-muted-foreground">Subtotal:</span> <span className="font-semibold">${quotation.total_amount}</span></p>
            <p><span className="text-muted-foreground">Tax:</span> <span className="font-semibold">${quotation.tax_amount}</span></p>
            <p className="text-lg"><span className="text-muted-foreground">Grand Total:</span> <span className="font-bold">${quotation.grand_total}</span></p>
          </div>

          {quotation.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p>{quotation.notes}</p>
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
