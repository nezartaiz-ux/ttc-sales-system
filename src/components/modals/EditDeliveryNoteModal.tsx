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
import { Plus, Trash2 } from "lucide-react";

interface EditDeliveryNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: any;
}

interface DeliveryItem {
  id?: string;
  inventory_item_id: string;
  model: string;
  description: string;
  quantity: number;
  remarks: string;
}

export const EditDeliveryNoteModal = ({ open, onOpenChange, deliveryNote }: EditDeliveryNoteModalProps) => {
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
    status: "pending",
  });

  const [items, setItems] = useState<DeliveryItem[]>([
    { inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "" }
  ]);

  // Load delivery note data
  useEffect(() => {
    if (deliveryNote && open) {
      setFormData({
        customer_id: deliveryNote.customer_id || "",
        customer_address: deliveryNote.customer_address || "",
        model: deliveryNote.model || "",
        warranty_type: deliveryNote.warranty_type || "under_warranty",
        mean_of_despatch: deliveryNote.mean_of_despatch || "",
        mean_number: deliveryNote.mean_number || "",
        driver_name: deliveryNote.driver_name || "",
        notes: deliveryNote.notes || "",
        status: deliveryNote.status || "pending",
      });

      if (deliveryNote.items && deliveryNote.items.length > 0) {
        setItems(deliveryNote.items.map((item: any) => ({
          id: item.id,
          inventory_item_id: item.inventory_item_id || "",
          model: item.model || "",
          description: item.description || "",
          quantity: item.quantity || 1,
          remarks: item.remarks || "",
        })));
      } else {
        setItems([{ inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "" }]);
      }
    }
  }, [deliveryNote, open]);

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Update delivery note
      const { error: noteError } = await supabase
        .from('delivery_notes')
        .update({
          customer_id: formData.customer_id,
          customer_address: formData.customer_address,
          model: formData.model,
          warranty_type: formData.warranty_type,
          mean_of_despatch: formData.mean_of_despatch,
          mean_number: formData.mean_number,
          driver_name: formData.driver_name,
          notes: formData.notes,
          status: formData.status,
        })
        .eq('id', deliveryNote.id);

      if (noteError) throw noteError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from('delivery_note_items')
        .delete()
        .eq('delivery_note_id', deliveryNote.id);

      if (deleteError) throw deleteError;

      // Insert updated items
      const itemsToInsert = items
        .filter(item => item.description)
        .map(item => ({
          delivery_note_id: deliveryNote.id,
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

      return deliveryNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      toast({
        title: "Updated",
        description: "Delivery note updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_address: customer?.address || formData.customer_address,
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
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id) {
      toast({
        title: "Error",
        description: "Please select a customer",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Delivery Note #{deliveryNote?.delivery_note_number}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
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
              <Label>Customer Address</Label>
              <Input
                value={formData.customer_address}
                onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                placeholder="Delivery address"
              />
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Product model"
              />
            </div>

            <div className="space-y-2">
              <Label>Material Condition</Label>
              <Select
                value={formData.warranty_type}
                onValueChange={(value) => setFormData({ ...formData, warranty_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="under_warranty">Under Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dispatching Details */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Dispatching Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Mean of Despatch</Label>
                <Input
                  value={formData.mean_of_despatch}
                  onChange={(e) => setFormData({ ...formData, mean_of_despatch: e.target.value })}
                  placeholder="Car, Truck, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  value={formData.mean_number}
                  onChange={(e) => setFormData({ ...formData, mean_number: e.target.value })}
                  placeholder="Plate number"
                />
              </div>
              <div className="space-y-2">
                <Label>Driver Name</Label>
                <Input
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  placeholder="Driver name"
                />
              </div>
            </div>
          </div>

          {/* Materials List */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Materials List</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                  <div className="col-span-12 md:col-span-2 space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Input
                      value={item.model}
                      onChange={(e) => updateItem(index, 'model', e.target.value)}
                      placeholder="Model"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Material description"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-3 space-y-1">
                    <Label className="text-xs">Remarks</Label>
                    <Input
                      value={item.remarks}
                      onChange={(e) => updateItem(index, 'remarks', e.target.value)}
                      placeholder="Remarks"
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
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
