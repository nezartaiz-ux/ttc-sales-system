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
  notes: z.string().max(1000).optional().or(z.literal(''))
});

interface QuotationItem {
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreateQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateQuotationModal = ({ open, onOpenChange, onSuccess }: CreateQuotationModalProps) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    validity_period: '',
    notes: ''
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
    if (open) loadData();
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
    const total_amount = items.reduce((sum, item) => sum + item.total_price, 0);
    const tax_amount = total_amount * 0.15; // 15% tax
    const grand_total = total_amount + tax_amount;
    return { total_amount, tax_amount, grand_total };
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
      
      // Generate quotation number
      const quotation_number = `QUO-${Date.now()}`;

      const quotationData = {
        quotation_number,
        customer_id: formData.customer_id,
        total_amount,
        tax_amount,
        grand_total,
        validity_period: formData.validity_period,
        notes: formData.notes.trim() || null,
        created_by: user.id
      };

      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .insert([quotationData])
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Insert quotation items
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

      toast({ title: 'Success', description: 'Quotation created successfully' });
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({ customer_id: '', validity_period: '', notes: '' });
      setItems([]);

    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to create quotation: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quotation</DialogTitle>
          <DialogDescription>Create a quotation for customer approval.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData(p => ({ ...p, customer_id: v }))}>
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
              <Label htmlFor="validity_period">Validity Period *</Label>
              <Input
                id="validity_period"
                type="date"
                value={formData.validity_period}
                onChange={(e) => setFormData(p => ({ ...p, validity_period: e.target.value }))}
                className={errors.validity_period ? 'border-destructive' : ''}
              />
              {errors.validity_period && <p className="text-sm text-destructive">{errors.validity_period}</p>}
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quotation Items</CardTitle>
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
                    <span>${totals.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (15%):</span>
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
              placeholder="Additional notes or terms"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Quotation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};