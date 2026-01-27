import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserCategories } from '@/hooks/useUserCategories';
import { z } from 'zod';

const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Select a valid supplier'),
  expected_delivery_date: z.string().min(1, 'Expected delivery date is required'),
  customs_duty_status: z.enum(['CIF Aden Freezone','DDP Aden','DDP Sana\'a']).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal(''))
});

interface POItem {
  inventory_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CreatePOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreatePOModal = ({ open, onOpenChange, onSuccess }: CreatePOModalProps) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    expected_delivery_date: new Date().toISOString().split('T')[0], // Set to today's date
    customs_duty_status: '',
    notes: '',
    status: 'sent' as 'draft' | 'sent' | 'received'
  });
  const [items, setItems] = useState<POItem[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; unit_price: number }[]>([]);
  const [quotations, setQuotations] = useState<{ id: string; quotation_number: string; customer_id: string }[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCategoryIds, hasRestrictions, loading: categoriesLoading } = useUserCategories();

  useEffect(() => {
    const loadData = async () => {
      const categoryIds = getCategoryIds();
      
      let inventoryQuery = supabase
        .from('inventory_items')
        .select('id, name, unit_price, category_id')
        .eq('is_active', true)
        .order('name');
      
      // Filter by user's categories if they have restrictions
      if (hasRestrictions && categoryIds.length > 0) {
        inventoryQuery = inventoryQuery.in('category_id', categoryIds);
      }

      const [{ data: suppliers }, { data: inventory }, { data: quots }] = await Promise.all([
        supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
        inventoryQuery,
        supabase.from('quotations').select('id, quotation_number, customer_id').order('created_at', { ascending: false })
      ]);
      setSuppliers(suppliers || []);
      setInventoryItems(inventory || []);
      setQuotations(quots || []);
    };
    if (open && !categoriesLoading) {
      loadData();
      // Reset expected_delivery_date to today when modal opens
      setFormData(prev => ({ ...prev, expected_delivery_date: new Date().toISOString().split('T')[0] }));
      setSelectedQuotationId('');
    }
  }, [open, categoriesLoading, hasRestrictions]);

  const addItem = () => {
    setItems(prev => [...prev, {
      inventory_item_id: '',
      item_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'inventory_item_id') {
        const item = inventoryItems.find(i => i.id === value);
        if (item) {
          updated[index].inventory_item_id = value;
          updated[index].item_name = item.name;
          updated[index].unit_price = item.unit_price;
          updated[index].total_price = updated[index].quantity * item.unit_price;
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

  const loadFromQuotation = async () => {
    if (!selectedQuotationId) {
      toast({ title: 'Error', description: 'Please select a quotation', variant: 'destructive' });
      return;
    }

    try {
      // Fetch quotation with items and customer info
      const { data: quotation, error: quotationError } = await supabase
        .from('quotations')
        .select('*, customers(id, name), quotation_items(inventory_item_id, quantity, unit_price, total_price, inventory_items(name))')
        .eq('id', selectedQuotationId)
        .single();

      if (quotationError) throw quotationError;

      if (quotation) {
        // Load items
        if (quotation.quotation_items && quotation.quotation_items.length > 0) {
          const importedItems: POItem[] = quotation.quotation_items.map((qi: any) => ({
            inventory_item_id: qi.inventory_item_id,
            item_name: qi.inventory_items?.name || '',
            quantity: qi.quantity,
            unit_price: qi.unit_price,
            total_price: qi.total_price
          }));
          setItems(importedItems);
        }

        // Load customs duty status from quotation
        if (quotation.customs_duty_status) {
          setFormData(prev => ({
            ...prev,
            customs_duty_status: quotation.customs_duty_status
          }));
        }

        toast({ 
          title: 'Success', 
          description: `Loaded ${quotation.quotation_items?.length || 0} items from quotation (Customer: ${quotation.customers?.name || 'N/A'})` 
        });
      } else {
        toast({ title: 'Info', description: 'No data found in selected quotation', variant: 'default' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to load quotation data: ${error.message}`, variant: 'destructive' });
    }
  };

  const calculateTotals = () => {
    const total_amount = items.reduce((sum, item) => sum + item.total_price, 0);
    
    // Calculate tax based on customs duty status
    let taxRate = 0;
    if (formData.customs_duty_status === 'DDP Aden') {
      taxRate = 0.17; // 17%
    } else if (formData.customs_duty_status === 'DDP Sana\'a') {
      taxRate = 0.21; // 21%
    }
    // CIF Aden Freezone = 0%
    
    const tax_amount = total_amount * taxRate;
    const grand_total = total_amount + tax_amount;
    return { total_amount, tax_amount, grand_total, taxRate };
  };

  const getTaxLabel = () => {
    if (formData.customs_duty_status === 'DDP Aden') {
      return 'Customs Duty & Sales Tax (17%)';
    } else if (formData.customs_duty_status === 'DDP Sana\'a') {
      return 'Customs Duty & Sales Tax (21%)';
    }
    return 'Tax (0%)';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    try {
      purchaseOrderSchema.parse(formData);
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
      
      // Generate PO number using database function
      const { data: numberData, error: numberError } = await supabase.rpc('generate_po_number');
      if (numberError) throw numberError;
      const order_number = numberData;

      const poData = {
        order_number,
        supplier_id: formData.supplier_id,
        total_amount,
        tax_amount,
        grand_total,
        expected_delivery_date: formData.expected_delivery_date,
        customs_duty_status: formData.customs_duty_status || null,
        notes: formData.notes.trim() || null,
        status: formData.status,
        created_by: user.id
      };

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([poData])
        .select()
        .single();

      if (poError) throw poError;

      // Insert PO items
      const poItems = items.map(item => ({
        purchase_order_id: po.id,
        inventory_item_id: item.inventory_item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsError) throw itemsError;

      toast({ title: 'Success', description: 'Purchase Order created successfully' });
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({ supplier_id: '', expected_delivery_date: '', customs_duty_status: '', notes: '', status: 'sent' });
      setItems([]);

    } catch (error: any) {
      toast({ title: 'Error', description: `Failed to create purchase order: ${error.message}`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>Create a purchase order to order items from suppliers.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => setFormData(p => ({ ...p, supplier_id: v }))}>
                <SelectTrigger className={errors.supplier_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && <p className="text-sm text-destructive">{errors.supplier_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery *</Label>
              <Input
                id="expected_delivery_date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData(p => ({ ...p, expected_delivery_date: e.target.value }))}
                className={errors.expected_delivery_date ? 'border-destructive' : ''}
              />
              {errors.expected_delivery_date && <p className="text-sm text-destructive">{errors.expected_delivery_date}</p>}
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v: 'draft' | 'sent' | 'received') => setFormData(p => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Customs Duty Status</Label>
            <Select value={formData.customs_duty_status} onValueChange={(v) => setFormData(p => ({ ...p, customs_duty_status: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select customs duty status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CIF Aden Freezone">CIF Aden Freezone (0% Tax)</SelectItem>
                <SelectItem value="DDP Aden">DDP Aden (17% Tax)</SelectItem>
                <SelectItem value="DDP Sana'a">DDP Sana'a (21% Tax)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Load from Quotation</Label>
                  <Select value={selectedQuotationId} onValueChange={setSelectedQuotationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quotation" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotations.map((q) => (
                        <SelectItem key={q.id} value={q.id}>{q.quotation_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={loadFromQuotation} variant="secondary">
                  <FileText className="h-4 w-4 mr-2" />
                  Load Items
                </Button>
                <Button type="button" onClick={addItem} size="default">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div>
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
              </div>
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
              placeholder="Additional notes or special instructions"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create PO'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};