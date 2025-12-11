import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2 } from "lucide-react";

interface CreateDeliveryNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importFromInvoice?: any;
}

interface DeliveryItem {
  inventory_item_id: string;
  model: string;
  description: string;
  quantity: number;
  remarks: string;
}

export const CreateDeliveryNoteModal = ({ open, onOpenChange, importFromInvoice }: CreateDeliveryNoteModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_address: "",
    model: "",
    warranty_type: "under_warranty",
    mean_of_despatch: "",
    mean_number: "",
    driver_name: "",
    notes: "",
  });

  const [items, setItems] = useState<DeliveryItem[]>([
    { inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "" }
  ]);

  // Import from invoice when provided
  useEffect(() => {
    if (importFromInvoice && open) {
      setFormData({
        customer_id: importFromInvoice.customer_id || "",
        customer_address: importFromInvoice.customers?.address || "",
        model: "",
        warranty_type: "new_sale",
        mean_of_despatch: "",
        mean_number: "",
        driver_name: "",
        notes: `مرجع الفاتورة: ${importFromInvoice.invoice_number}`,
      });

      // Import items from invoice
      if (importFromInvoice.sales_invoice_items && importFromInvoice.sales_invoice_items.length > 0) {
        const importedItems = importFromInvoice.sales_invoice_items.map((item: any) => ({
          inventory_item_id: item.inventory_item_id || "",
          model: "",
          description: item.inventory_items?.name || "",
          quantity: item.quantity || 1,
          remarks: "",
        }));
        setItems(importedItems);
      }
    }
  }, [importFromInvoice, open]);

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, address')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Generate delivery note number
      const { data: noteNumber, error: numError } = await supabase.rpc('generate_delivery_note_number');
      if (numError) throw numError;

      // Create delivery note
      const { data: note, error: noteError } = await supabase
        .from('delivery_notes')
        .insert({
          delivery_note_number: noteNumber,
          customer_id: formData.customer_id,
          customer_address: formData.customer_address,
          model: formData.model,
          warranty_type: formData.warranty_type,
          mean_of_despatch: formData.mean_of_despatch,
          mean_number: formData.mean_number,
          driver_name: formData.driver_name,
          notes: formData.notes,
          created_by: user?.id,
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Create items
      const itemsToInsert = items
        .filter(item => item.description)
        .map(item => ({
          delivery_note_id: note.id,
          inventory_item_id: item.inventory_item_id || null,
          model: item.model,
          description: item.description,
          quantity: item.quantity,
          remarks: item.remarks,
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase
          .from('delivery_note_items')
          .insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast({
        title: "تم الإنشاء",
        description: "تم إنشاء وثيقة التسليم بنجاح",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customer_id: "",
      customer_address: "",
      model: "",
      warranty_type: "under_warranty",
      mean_of_despatch: "",
      mean_number: "",
      driver_name: "",
      notes: "",
    });
    setItems([{ inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "" }]);
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_address: customer?.address || "",
    });
  };

  const addItem = () => {
    setItems([...items, { inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof DeliveryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If inventory item is selected, fill in description
    if (field === 'inventory_item_id' && value) {
      const item = inventoryItems?.find(i => i.id === value);
      if (item) {
        newItems[index].description = item.description || item.name;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار العميل",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء وثيقة تسليم جديدة</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>العميل *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>عنوان العميل</Label>
              <Input
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                placeholder="عنوان التسليم"
              />
            </div>

            <div className="space-y-2">
              <Label>الموديل</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="موديل المنتج"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع الضمان</Label>
              <Select
                value={formData.warranty_type}
                onValueChange={(value) => setFormData({ ...formData, warranty_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_warranty">تحت الضمان</SelectItem>
                  <SelectItem value="out_of_warranty">خارج الضمان</SelectItem>
                  <SelectItem value="new_sale">بيع جديد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dispatching Details */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">تفاصيل الإرسال</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>وسيلة الإرسال</Label>
                <Input
                  value={formData.mean_of_despatch}
                  onChange={(e) => setFormData({ ...formData, mean_of_despatch: e.target.value })}
                  placeholder="سيارة، شاحنة، إلخ"
                />
              </div>
              <div className="space-y-2">
                <Label>رقم الوسيلة</Label>
                <Input
                  value={formData.mean_number}
                  onChange={(e) => setFormData({ ...formData, mean_number: e.target.value })}
                  placeholder="رقم اللوحة"
                />
              </div>
              <div className="space-y-2">
                <Label>اسم السائق</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  placeholder="اسم السائق"
                />
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">قائمة المواد</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                إضافة عنصر
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                  <div className="col-span-12 md:col-span-2 space-y-1">
                    <Label className="text-xs">الموديل</Label>
                    <Input
                      value={item.model}
                      onChange={(e) => updateItem(index, 'model', e.target.value)}
                      placeholder="الموديل"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-xs">الوصف *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="وصف المادة"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-xs">الكمية</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs">ملاحظات</Label>
                    <Input
                      value={item.remarks}
                      onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                      placeholder="ملاحظات"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="ملاحظات إضافية"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
