import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Printer } from "lucide-react";
import { generatePOPDF, printPO } from "@/utils/pdfExport";

interface ViewPOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: any;
}

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
      notes: purchaseOrder.notes
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
      notes: purchaseOrder.notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Order - {purchaseOrder.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{purchaseOrder.suppliers?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{purchaseOrder.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected Delivery</p>
              <p className="font-medium">{purchaseOrder.expected_delivery_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{new Date(purchaseOrder.created_at).toLocaleDateString()}</p>
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
                {purchaseOrder.purchase_order_items?.map((item: any) => (
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
            <p><span className="text-muted-foreground">Subtotal:</span> <span className="font-semibold">${purchaseOrder.total_amount}</span></p>
            <p><span className="text-muted-foreground">Tax:</span> <span className="font-semibold">${purchaseOrder.tax_amount}</span></p>
            <p className="text-lg"><span className="text-muted-foreground">Grand Total:</span> <span className="font-bold">${purchaseOrder.grand_total}</span></p>
          </div>

          {purchaseOrder.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p>{purchaseOrder.notes}</p>
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
