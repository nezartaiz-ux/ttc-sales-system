import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150, 'Name must be less than 150 characters'),
  category_id: z.string().uuid('Select a valid category'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be 0 or more'),
  unit_price: z.coerce.number().min(0, 'Unit price must be 0 or more'),
  selling_price: z.coerce.number().min(0, 'Selling price must be 0 or more'),
  min_stock_level: z.coerce.number().int().min(0).optional(),
  sku: z.string().trim().max(100).optional().or(z.literal('')),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  batch_number: z.string().trim().max(100).optional().or(z.literal('')),
  supplier_id: z.string().uuid().optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
});

interface Option { id: string; name: string }

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editItem?: any;
}

export const AddItemModal = ({ open, onOpenChange, onSuccess, editItem }: AddItemModalProps) => {
  const isEditing = !!editItem;
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    quantity: 0,
    unit_price: 0,
    selling_price: 0,
    min_stock_level: 0,
    sku: '',
    location: '',
    batch_number: '',
    supplier_id: '',
    description: '',
  });
  const [categories, setCategories] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const loadOptions = async () => {
      const [{ data: cats }, { data: sups }] = await Promise.all([
        supabase.from('product_categories').select('id, name').order('name'),
        supabase.from('suppliers').select('id, name').order('name'),
      ]);
      setCategories((cats || []) as Option[]);
      setSuppliers((sups || []) as Option[]);
    };
    if (open) {
      loadOptions();
      // Pre-fill form if editing
      if (editItem) {
        setFormData({
          name: editItem.name || '',
          category_id: editItem.category_id || '',
          quantity: editItem.quantity || 0,
          unit_price: editItem.unit_price || 0,
          selling_price: editItem.selling_price || 0,
          min_stock_level: editItem.min_stock_level || 0,
          sku: editItem.sku || '',
          location: editItem.location || '',
          batch_number: editItem.batch_number || '',
          supplier_id: editItem.supplier_id || '',
          description: editItem.description || '',
        });
      } else {
        // Reset form for new item
        setFormData({
          name: '', category_id: '', quantity: 0, unit_price: 0, selling_price: 0,
          min_stock_level: 0, sku: '', location: '', batch_number: '', supplier_id: '', description: ''
        });
      }
    }
  }, [open, editItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate
    try {
      itemSchema.parse(formData);
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

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        category_id: formData.category_id,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        selling_price: formData.selling_price,
        min_stock_level: formData.min_stock_level || 0,
        sku: formData.sku.trim() || null,
        location: formData.location.trim() || null,
        batch_number: formData.batch_number.trim() || null,
        supplier_id: formData.supplier_id || null,
        description: formData.description.trim() || null,
      };

      let error;
      if (isEditing) {
        ({ error } = await supabase.from('inventory_items').update(payload).eq('id', editItem.id));
      } else {
        ({ error } = await supabase.from('inventory_items').insert([{ ...payload, created_by: user.id }]));
      }

      if (error) {
        toast({ title: 'Error', description: `Failed to ${isEditing ? 'update' : 'add'} item: ${error.message}`, variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: `Item ${isEditing ? 'updated' : 'added'} successfully` });
        onOpenChange(false);
        onSuccess?.();
        setFormData({
          name: '', category_id: '', quantity: 0, unit_price: 0, selling_price: 0,
          min_stock_level: 0, sku: '', location: '', batch_number: '', supplier_id: '', description: ''
        });
      }
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleField = (field: string, value: any) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update item details.' : 'Enter item details to add to inventory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleField('name', e.target.value)} className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category_id} onValueChange={(v) => handleField('category_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && <p className="text-sm text-destructive">{errors.category_id}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" type="number" min={0} value={formData.quantity}
                onChange={(e) => handleField('quantity', Number(e.target.value))} className={errors.quantity ? 'border-destructive' : ''} />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock_level">Min Stock</Label>
              <Input id="min_stock_level" type="number" min={0} value={formData.min_stock_level}
                onChange={(e) => handleField('min_stock_level', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input id="unit_price" type="number" min={0} step="0.01" value={formData.unit_price}
                onChange={(e) => handleField('unit_price', Number(e.target.value))} className={errors.unit_price ? 'border-destructive' : ''} />
              {errors.unit_price && <p className="text-sm text-destructive">{errors.unit_price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price *</Label>
              <Input id="selling_price" type="number" min={0} step="0.01" value={formData.selling_price}
                onChange={(e) => handleField('selling_price', Number(e.target.value))} className={errors.selling_price ? 'border-destructive' : ''} />
              {errors.selling_price && <p className="text-sm text-destructive">{errors.selling_price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={formData.sku} onChange={(e) => handleField('sku', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={formData.location} onChange={(e) => handleField('location', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_number">Batch Number</Label>
              <Input id="batch_number" value={formData.batch_number} onChange={(e) => handleField('batch_number', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={formData.supplier_id} onValueChange={(v) => handleField('supplier_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={formData.description} onChange={(e) => handleField('description', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (isEditing ? 'Updating…' : 'Adding…') : (isEditing ? 'Update Item' : 'Add Item')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}