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

const quotationSchema = z.object({
  customer_id: z.string().uuid('Select a valid customer'),
  validity_period: z.string().min(1, 'Validity period is required'),
  payment_terms: z.string().max(200).optional().or(z.literal('')),
  customs_duty_status: z.enum(['CIF Aden Freezone','DDP Aden','DDP Sana\'a']).optional().or(z.literal('')),
  conditions: z.string().max(1000).optional().or(z.literal('')),
  delivery_terms: z.string().max(300).optional().or(z.literal('')),
  delivery_details: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal(''))
});

interface QuotationItem {
  id?: string;
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface EditQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  onSuccess?: () => void;
}

export const EditQuotationModal = ({ open, onOpenChange, quotation, onSuccess }: EditQuotationModalProps) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    validity_period: '',
    payment_terms: '',
    customs_duty_status: '',
    conditions: '',
    delivery_terms: '',
    delivery_details: '',
    notes: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0
  });
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; selling_price: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      const [{ data: customers }, { data: inventory }] = await Promise.all([
        supabase.from('customers').select('id, name').eq('is_active', true).order('name'),
        supabase.from('inventory_items').select('id, name, selling_price').eq('is_active', true).order('name')
      ]);
      setCustomers(customers || []);
      setInventoryItems(inventory || []);
    };

    if (open && quotation) {
      loadData();
      
      // Pre-fill form data
      setFormData({
        customer_id: quotation.customer_id || '',
        validity_period: quotation.validity_period || '',
        payment_terms: quotation.payment_terms || '',
        customs_duty_status: quotation.customs_duty_status || '',
        conditions: quotation.conditions || '',
        delivery_terms: quotation.delivery_terms || '',
        delivery_details: quotation.delivery_details || '',
        notes: quotation.notes || '',
        discount_type: quotation.discount_type || 'percentage',
        discount_value: quotation.discount_value || 0
      });

      // Pre-fill items
      if (quotation.quotation_items) {
        setItems(quotation.quotation_items.map((item: any) => ({
          id: item.id,
          inventory_item_id: item.inventory_item_id,
          item_name: item.inventory_items?.name || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })));
      }
    }
  }, [open, quotation]);

  const addItem = () => {
    setItems(prev => [...prev, {
      inventory_item_id: '',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
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
      quotationSchema.parse(formData);
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

      const quotationData = {
        customer_id: formData.customer_id,
        total_amount,
        tax_amount,
        grand_total,
        validity_period: formData.validity_period,
        payment_terms: formData.payment_terms.trim() || null,
        customs_duty_status: formData.customs_duty_status || null,
        conditions: formData.conditions.trim() || null,
        delivery_terms: formData.delivery_terms.trim() || null,
        delivery_details: formData.delivery_details.trim() || null,
        notes: formData.notes.trim() || null,
        discount_type: formData.discount_value > 0 ? formData.discount_type : null,
        discount_value: formData.discount_value > 0 ? formData.discount_value : null,
      };

      // Update quotation
      const { error: quotationError } = await supabase
        .from('quotations')
        .update(quotationData)
        .eq('id', quotation.id);

      if (quotationError) throw quotationError;

      // Delete old items
      const { error: deleteError } = await supabase
        .from('quotation_items')
        .delete()
        .eq('quotation_id', quotation.id);

      if (deleteError) throw deleteError;

      // Insert new items
      const quotationItems = items.map(item => ({
        quotation_id: quotation.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('quotation_items')
        .insert(quotationItems);

      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Quotation updated successfully' });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error updating quotation:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quotation - {quotation?.quotation_number}</DialogTitle>
          <DialogDescription>Update quotation details and items</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_id">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                <SelectTrigger id="customer_id">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-sm text-destructive mt-1">{errors.customer_id}</p>}
            </div>

            <div>
              <Label htmlFor="validity_period">Valid Until *</Label>
              <Input
                id="validity_period"
                type="date"
                value={formData.validity_period}
                onChange={(e) => setFormData({ ...formData, validity_period: e.target.value })}
              />
              {errors.validity_period && <p className="text-sm text-destructive mt-1">{errors.validity_period}</p>}
            </div>

            <div>
              <Label htmlFor="customs_duty_status">Customs & Duty Status</Label>
              <Select value={formData.customs_duty_status} onValueChange={(value) => setFormData({ ...formData, customs_duty_status: value })}>
                <SelectTrigger id="customs_duty_status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIF Aden Freezone">CIF Aden Freezone (0% tax)</SelectItem>
                  <SelectItem value="DDP Aden">DDP Aden (17% tax)</SelectItem>
                  <SelectItem value="DDP Sana'a">DDP Sana'a (21% tax)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="e.g., Net 30 days"
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="delivery_terms">Delivery Terms</Label>
              <Input
                id="delivery_terms"
                value={formData.delivery_terms}
                onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                placeholder="e.g., FOB, CIF"
                maxLength={300}
              />
            </div>

            <div>
              <Label htmlFor="delivery_details">Delivery Details</Label>
              <Input
                id="delivery_details"
                value={formData.delivery_details}
                onChange={(e) => setFormData({ ...formData, delivery_details: e.target.value })}
                placeholder="Delivery location and timeline"
                maxLength={1000}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="conditions">Conditions</Label>
            <Textarea
              id="conditions"
              value={formData.conditions}
              onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              placeholder="Any special conditions"
              rows={3}
              maxLength={1000}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select value={item.inventory_item_id} onValueChange={(value) => updateItem(index, 'inventory_item_id', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventoryItems.map(invItem => (
                              <SelectItem key={invItem.id} value={invItem.id}>{invItem.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>${item.total_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button type="button" variant="outline" onClick={addItem} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger id="discount_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">Discount Value</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                {formData.discount_value > 0 && (
                  <>
                    <div className="flex justify-between text-destructive">
                      <span>Discount ({formData.discount_type === 'percentage' ? `${formData.discount_value}%` : '$'}):</span>
                      <span>-${totals.discount_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Amount:</span>
                      <span>${totals.total_amount.toFixed(2)}</span>
                    </div>
                  </>
                )}
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

          <div>
            <Label htmlFor="notes">Terms & Conditions</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={8}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Quotation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
