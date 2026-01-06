import { useState, useEffect, useMemo } from "react";
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
import { useUserCategories } from "@/hooks/useUserCategories";
import { Plus, Trash2, FileDown } from "lucide-react";

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
  item_category: string;
}

export const CreateDeliveryNoteModal = ({ open, onOpenChange, importFromInvoice }: CreateDeliveryNoteModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userCategories, hasRestrictions, getCategoryIds, loading: categoriesLoading } = useUserCategories();

  const [formData, setFormData] = useState({
    customer_id: "",
    customer_address: "",
    model: "",
    warranty_type: "new",
    mean_of_despatch: "",
    mean_number: "",
    driver_name: "",
    notes: "",
  });

  const [items, setItems] = useState<DeliveryItem[]>([
    { inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "", item_category: "generator" }
  ]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");

  // Get allowed item categories based on user's product categories
  const allowedItemCategories = useMemo(() => {
    if (!hasRestrictions) return ['generator', 'equipment', 'tractor'];
    
    const categoryNames = userCategories.map(c => c.name.toLowerCase());
    const allowed: string[] = [];
    
    categoryNames.forEach(name => {
      if (name.includes('generator') || name.includes('مولد')) allowed.push('generator');
      if (name.includes('equipment') || name.includes('معد')) allowed.push('equipment');
      if (name.includes('tractor') || name.includes('حراث')) allowed.push('tractor');
    });
    
    return [...new Set(allowed)];
  }, [userCategories, hasRestrictions]);

  // Import from invoice when provided
  useEffect(() => {
    if (importFromInvoice && open) {
      setFormData({
        customer_id: importFromInvoice.customer_id || "",
        customer_address: importFromInvoice.customers?.address || "",
        model: "",
        warranty_type: "new",
        mean_of_despatch: "",
        mean_number: "",
        driver_name: "",
        notes: `Invoice Reference: ${importFromInvoice.invoice_number}`,
      });

      // Import items from invoice
      if (importFromInvoice.sales_invoice_items && importFromInvoice.sales_invoice_items.length > 0) {
        const importedItems = importFromInvoice.sales_invoice_items.map((item: any) => ({
          inventory_item_id: item.inventory_item_id || "",
          model: "",
          description: item.inventory_items?.name || "",
          quantity: item.quantity || 1,
          remarks: "",
          item_category: allowedItemCategories[0] || "generator",
        }));
        setItems(importedItems);
      }
    }
  }, [importFromInvoice, open, allowedItemCategories]);

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
    queryKey: ['inventory-items-for-dn', hasRestrictions, userCategories],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('id, name, description, category_id')
        .eq('is_active', true)
        .order('name');
      
      // Filter by user's categories
      const categoryIds = getCategoryIds();
      if (hasRestrictions && categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !categoriesLoading,
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices-for-delivery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          customers:customer_id(name, address),
          sales_invoice_items(
            id,
            inventory_item_id,
            quantity,
            inventory_items:inventory_item_id(name)
          )
        `)
        .order('created_at', { ascending: false });
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
          sales_invoice_id: importFromInvoice?.id || (selectedInvoiceId || null),
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
          remarks: `[${getCategoryLabel(item.item_category)}] ${item.remarks}`.trim(),
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
        title: "Created",
        description: "Delivery note created successfully",
      });
      resetForm();
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

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'generator': return 'Generator';
      case 'equipment': return 'Equipment';
      case 'tractor': return 'Tractor';
      default: return category;
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      customer_address: "",
      model: "",
      warranty_type: "new",
      mean_of_despatch: "",
      mean_number: "",
      driver_name: "",
      notes: "",
    });
    setItems([{ inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "", item_category: "generator" }]);
    setSelectedInvoiceId("");
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    setFormData({
      ...formData,
      customer_id: customerId,
      customer_address: customer?.address || "",
    });
  };

  const handleInvoiceImport = (invoiceId: string) => {
    if (!invoiceId) return;
    
    const invoice = invoices?.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    setSelectedInvoiceId(invoiceId);
    setFormData({
      ...formData,
      customer_id: invoice.customer_id || "",
      customer_address: (invoice.customers as any)?.address || "",
      notes: `Invoice Reference: ${invoice.invoice_number}`,
    });

    // Import items from invoice
    if (invoice.sales_invoice_items && invoice.sales_invoice_items.length > 0) {
      const importedItems = invoice.sales_invoice_items.map((item: any) => ({
        inventory_item_id: item.inventory_item_id || "",
        model: "",
        description: item.inventory_items?.name || "",
        quantity: item.quantity || 1,
        remarks: "",
        item_category: "generator",
      }));
      setItems(importedItems);
    }

    toast({
      title: "Imported",
      description: `Data imported from invoice ${invoice.invoice_number}`,
    });
  };

  const addItem = () => {
    setItems([...items, { inventory_item_id: "", model: "", description: "", quantity: 1, remarks: "", item_category: "generator" }]);
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
        title: "Error",
        description: "Please select a customer",
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
          <DialogTitle>Create New Delivery Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Import from Invoice */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              Import from Invoice (Optional)
            </h3>
            <div className="space-y-2">
              <Label>Select Invoice</Label>
              <Select
                value={selectedInvoiceId}
                onValueChange={handleInvoiceImport}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an invoice to import data" />
                </SelectTrigger>
                <SelectContent>
                  {invoices?.map((invoice) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} - {(invoice.customers as any)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={item.item_category}
                      onValueChange={(value) => updateItem(index, 'item_category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(!hasRestrictions || allowedItemCategories.includes('generator')) && (
                          <SelectItem value="generator">Generator</SelectItem>
                        )}
                        {(!hasRestrictions || allowedItemCategories.includes('equipment')) && (
                          <SelectItem value="equipment">Equipment</SelectItem>
                        )}
                        {(!hasRestrictions || allowedItemCategories.includes('tractor')) && (
                          <SelectItem value="tractor">Tractor</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 md:col-span-2 space-y-1">
                    <Label className="text-xs">From Inventory</Label>
                    <Select
                      value={item.inventory_item_id || "manual"}
                      onValueChange={(value) => updateItem(index, 'inventory_item_id', value === "manual" ? "" : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">-- Manual Entry --</SelectItem>
                        {inventoryItems?.map((invItem) => (
                          <SelectItem key={invItem.id} value={invItem.id}>
                            {invItem.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 md:col-span-2 space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Input
                      value={item.model}
                      onChange={(e) => updateItem(index, 'model', e.target.value)}
                      placeholder="Model"
                    />
                  </div>
                  <div className="col-span-12 md:col-span-2 space-y-1">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Material description"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-1">
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
