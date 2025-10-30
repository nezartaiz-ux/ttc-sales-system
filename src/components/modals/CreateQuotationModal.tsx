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

const DEFAULT_TERMS_CONDITIONS = `TERMS AND CONDITIONS OF SALE :

	Manufacturer's warranty:

Manufacturer's warranty will be applicable for One year or 2500 Hours whichever occurs earlier from the date of commissioning of Genset. 
Warranty shall not cover failures that might result due to accidents, misuse or due to not following proper operation and maintenance instructions. NO WARRANTY APPLICABLE ON FUEL PUMP, INJECTORS, V'-BELTS & BATTERY. 
During the warranty period, Tehama Service Engineer will be deputed to only those areas where security threat is not there. The transportation of Tehama engineer with proper security to site and back to Tehama office to be arranged by the owner of the Genset.  
"Warranty applies to the customer purchasing the Genset / Panel. If ownership changes hand warranty is null and void.


	Force Majeure: 
The delivery indicated is subject to standard "Force Majeure". 
"Force majeure" shall mean any circumstance which is unforeseeable, sudden, insurmountable and outside the control of the parties and not caused by the action, omission or negligence of the Party or its subcontractors claiming suspension, including without limitation acts of God, embargoes, epidemic, flood, explosion, fire, lightning, earthquake, war, riot, military action, insurrection, terrorist or anti- Government acts, civil disturbance, strike (except the strike of the Personnel), Government order, decision or administrative ruling, Court order, Government inaction. 


	Insurance: 
If the ownership of the goods has already been transferred to the owner at the time of claim of insurance, the bidder will agree to coordinate for the fair settlement of the insurance, the bidder will agree to co-ordinate for fair settlement of the insurance but all the paper work will have transacted by the owner,
The bidder has included in his bid only for insurance of all supplies as follows:
1.	Marine insurance for all imported goods up to Hodeidah' / Aden port as per local insurance company limitations.
2.	Workmen compensation insurance for Tehama and its sub contractor's personnel as applicable by local laws, when visiting site.
All other insurance coverage required for the contract shall be taken by the buyer, such as land insurance, erection all risk insurance for the equipment covered under this contract and Surrounding properties. Any insurance required by the buyer's personnel, its contractor or any property on the premises where the project could be executed under this contract.
	Erection & Commissioning: 
    
While the commissioning of the unit quoted will be done by our Engineer free of charge, it should be understood that all the Civil / Mechanical / Electrical work and material connected with the installation and erection of the unit and connecting to the load are to be arranged by the buyer.

	Validity: 
      
This offer is valid for 2 Weeks from the date of price part only and thereafter subject to reconfirmation for the factory orders. Delivery is subject to prior sale.

	Cancellation: 
      
Order once placed cannot be cancelled without the concurrence of the seller.
     In the event of the buyer canceling the order, the advance paid by the buyer will be forfeited.

EXCLUSIONS:
 Our offer excludes the following:
1.	Bulk fuel storage Tank, fuel unloading facility like transfer pumps, fuel flow meters.
2.	Fuel & consumables during trial run / commissioning at site.
3.	Erection of Genset. However, Commissioning of the Genset will be carried out by our Engineer at no extra charge.
4.	Piping for Exhaust, Fuel and lube oil.
5.	Insulation for Exhaust pipe & Exhaust supports.
6.	All kinds of Civil Work.
7.	Any other items not covered under this proposal.
The terms & conditions made by us as well as the technical specification of the unit offered are the only ones which are acceptable to us and no other conditions will be applied or implied upon unless agreed to by us in writing.

We have attached herewith the Catalogue which shows optional attachments. Please note all may not be applicable for the offered Genset. Refer to the technical specifications attached.
We sincerely trust that our offer will meet with your requirement and look forward to receiving your order.`;

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
    validity_period: new Date().toISOString().split('T')[0], // Set to today's date
    payment_terms: '',
    customs_duty_status: '',
    conditions: '',
    delivery_terms: '',
    delivery_details: '',
    notes: DEFAULT_TERMS_CONDITIONS
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
    if (open) {
      loadData();
      // Reset validity_period and notes when modal opens
      setFormData(prev => ({ 
        ...prev, 
        validity_period: new Date().toISOString().split('T')[0],
        notes: DEFAULT_TERMS_CONDITIONS
      }));
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
      
      // Generate quotation number using database function
      const { data: numberData, error: numberError } = await supabase.rpc('generate_quotation_number');
      if (numberError) throw numberError;
      const quotation_number = numberData;

      const quotationData = {
        quotation_number,
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
      setFormData({ 
        customer_id: '', 
        validity_period: '', 
        payment_terms: '', 
        customs_duty_status: '', 
        conditions: '', 
        delivery_terms: '', 
        delivery_details: '', 
        notes: DEFAULT_TERMS_CONDITIONS 
      });
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData(p => ({ ...p, payment_terms: e.target.value }))}
                placeholder="e.g., 50% advance, 50% on delivery"
              />
            </div>
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="conditions">Conditions</Label>
              <Textarea
                id="conditions"
                rows={3}
                value={formData.conditions}
                onChange={(e) => setFormData(p => ({ ...p, conditions: e.target.value }))}
                placeholder="General conditions, warranty, payment instructions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_terms">Delivery Terms</Label>
              <Input
                id="delivery_terms"
                value={formData.delivery_terms}
                onChange={(e) => setFormData(p => ({ ...p, delivery_terms: e.target.value }))}
                placeholder="e.g., Delivered within 30 days"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_details">Delivery Details</Label>
              <Textarea
                id="delivery_details"
                rows={3}
                value={formData.delivery_details}
                onChange={(e) => setFormData(p => ({ ...p, delivery_details: e.target.value }))}
                placeholder="Location, contact person, unloading requirements"
              />
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
            <Label htmlFor="notes">Terms & Conditions</Label>
            <Textarea
              id="notes"
              rows={10}
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Terms and conditions"
              className="font-mono text-sm"
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