import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const invoiceSchema = z.object({
  customer_id: z.string().uuid('Select a valid customer'),
  purchase_order_id: z.string().uuid().optional().or(z.literal('')),
  invoice_type: z.enum(['cash', 'credit']),
  payment_terms: z.coerce.number().min(1).optional(),
  due_date: z.string().optional().or(z.literal('')),
  customs_duty_status: z.enum(['CIF Aden Freezone','DDP Aden','DDP Sana\'a']).optional().or(z.literal('')),
  conditions: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal(''))
});

interface InvoiceItem {
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateInvoiceModal = ({ open, onOpenChange, onSuccess }: CreateInvoiceModalProps) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    purchase_order_id: '',
    invoice_type: 'cash' as 'cash' | 'credit',
    payment_terms: 30,
    due_date: new Date().toISOString().split('T')[0], // Set to today's date
    customs_duty_status: '',
    conditions: '',
    notes: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; selling_price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      const [{ data: customers }, { data: pos }, { data: inventory }] = await Promise.all([
        supabase.from('customers').select('id, name').eq('is_active', true).order('name'),
        supabase.from('purchase_orders').select('*, supplier_id, suppliers(name), purchase_order_items(*, inventory_items(*))').order('created_at', { ascending: false }),
        supabase.from('inventory_items').select('id, name, selling_price').eq('is_active', true).order('name')
      ]);
      setCustomers(customers || []);
      setPurchaseOrders(pos || []);
      setInventoryItems(inventory || []);
    };
    if (open) {
      loadData();
      // Reset due_date to today when modal opens
      setFormData(prev => ({ ...prev, due_date: new Date().toISOString().split('T')[0] }));
    }
  }, [open]);

  const addItem = () => {
    setItems(prev => [...prev, {
      inventory_item_id: '',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'inventory_item_id') {
        const item = inventoryItems.find(i => i.id === value);
        if (item) {
          updated[index].inventory_item_id = value;
          updated[index].item_name = item.name;
          updated[index].unit_price = item.selling_price;
          updated[index].total_price = updated[index].quantity * item.selling_price;
        }
      } else if (field === 'quantity') {
        updated[index].quantity = value;
        updated[index].total_price = value * updated[index].unit_price;
      } else if (field === 'unit_price') {
        updated[index].unit_price = value;
        updated[index].total_price = updated[index].quantity * value;
      } else {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Apply discount
    let discount_amount = 0;
    if (formData.discount_value > 0) {
      if (formData.discount_type === 'percentage') {
        discount_amount = subtotal * (formData.discount_value / 100);
      } else {
        discount_amount = formData.discount_value;
      }
    }
    
    const total_amount = subtotal - discount_amount;
    
    // Calculate tax based on customs duty status (after discount)
    let taxRate = 0;
    if (formData.customs_duty_status === 'DDP Aden') {
      taxRate = 0.17; // 17%
    } else if (formData.customs_duty_status === 'DDP Sana\'a') {
      taxRate = 0.21; // 21%
    }
    // CIF Aden Freezone = 0%
    
    const tax_amount = total_amount * taxRate;
    const grand_total = total_amount + tax_amount;
    return { subtotal, discount_amount, total_amount, tax_amount, grand_total, taxRate };
  };

  const getTaxLabel = () => {
    if (formData.customs_duty_status === 'DDP Aden') {
      return 'Tax (17%)';
    } else if (formData.customs_duty_status === 'DDP Sana\'a') {
      return 'Tax (21%)';
    }
    return 'Tax (0%)';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    try {
      invoiceSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    if (items.length === 0) {
      toast({ title: 'Error', description: 'Add at least one item', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const { total_amount, tax_amount, grand_total } = calculateTotals();
      
      // Generate invoice number using database function
      const { data: numberData, error: numberError } = await supabase.rpc('generate_invoice_number');
      if (numberError) throw numberError;
      const invoice_number = numberData;

      const invoiceData = {
        invoice_number,
        customer_id: formData.customer_id,
        purchase_order_id: formData.purchase_order_id || null,
        invoice_type: formData.invoice_type,
        payment_terms: formData.invoice_type === 'credit' ? formData.payment_terms : null,
        due_date: formData.due_date || null,
        total_amount,
        tax_amount,
        grand_total,
        notes: formData.notes.trim() || null,
        customs_duty_status: formData.customs_duty_status || null,
        conditions: formData.conditions.trim() || null,
        discount_type: formData.discount_value > 0 ? formData.discount_type : null,
        discount_value: formData.discount_value > 0 ? formData.discount_value : null,
        created_by: user.id
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const invoiceItems = items.map(item => ({
        sales_invoice_id: invoice.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Sales Invoice created successfully' });
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({
        customer_id: '', purchase_order_id: '', invoice_type: 'cash',
        payment_terms: 30, due_date: '', customs_duty_status: '', conditions: '', notes: '',
        discount_type: 'percentage', discount_value: 0
      });
      setItems([]);

    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to create invoice: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Sales Invoice</DialogTitle>
          <DialogDescription>Create an invoice for customer billing.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData(p => ({ ...p, customer_id: v, purchase_order_id: '' }))}>
                <SelectTrigger className={errors.customer_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>Import from Purchase Order (Optional)</Label>
              <Select value={formData.purchase_order_id} onValueChange={(v) => {
                setFormData(p => ({ ...p, purchase_order_id: v }));
                // Auto-populate items from PO
                const selectedPO = purchaseOrders.find(po => po.id === v);
                if (selectedPO && selectedPO.purchase_order_items) {
                  const poItems = selectedPO.purchase_order_items.map((pi: any) => ({
                    inventory_item_id: pi.inventory_item_id,
                    item_name: pi.inventory_items?.name || '',
                    quantity: pi.quantity,
                    unit_price: pi.inventory_items?.selling_price || pi.unit_price,
                    total_price: pi.quantity * (pi.inventory_items?.selling_price || pi.unit_price)
                  }));
                  setItems(poItems);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purchase order" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.order_number} - {po.suppliers?.name || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Invoice Type *</Label>
              <Select value={formData.invoice_type} onValueChange={(v: 'cash' | 'credit') => setFormData(p => ({ ...p, invoice_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.invoice_type === 'credit' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms (Days)</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    min="1"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData(p => ({ ...p, payment_terms: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(p => ({ ...p, due_date: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customs & Duty Status</Label>
              <Select value={formData.customs_duty_status} onValueChange={(v) => setFormData(p => ({ ...p, customs_duty_status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customs & duty status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIF Aden Freezone">CIF Aden Freezone: 0% (without customs duty and sales tax)</SelectItem>
                  <SelectItem value="DDP Aden">DDP Aden: 17% (Aden customs duty & sales tax paid basis)</SelectItem>
                  <SelectItem value="DDP Sana'a">DDP Sana'a: 21% (Aden & Sana'a customs duty & sales tax paid basis)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions</Label>
              <Textarea
                id="conditions"
                rows={3}
                value={formData.conditions}
                onChange={(e) => setFormData(p => ({ ...p, conditions: e.target.value }))}
                placeholder="Payment and contract conditions"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Discount Type</Label>
              <Select value={formData.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setFormData(p => ({ ...p, discount_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_value">Discount Value</Label>
              <Input
                id="discount_value"
                type="number"
                min="0"
                step={formData.discount_type === 'percentage' ? '0.01' : '0.01'}
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                value={formData.discount_value}
                onChange={(e) => setFormData(p => ({ ...p, discount_value: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoice Items</CardTitle>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No items added</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.inventory_item_id}
                            onValueChange={(v) => updateItem(index, 'inventory_item_id', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventoryItems.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>{inv.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>${item.total_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : 'Fixed'}):</span>
                      <span>-${totals.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Total after Discount:</span>
                    <span>${totals.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{getTaxLabel()}:</span>
                    <span>${totals.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Grand Total:</span>
                    <span>${totals.grand_total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Additional notes or payment instructions"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};