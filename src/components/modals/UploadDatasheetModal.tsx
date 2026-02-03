import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useUserCategories } from "@/hooks/useUserCategories";

interface UploadDatasheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DatasheetCategory = 'generator' | 'equipment' | 'tractor';

export const UploadDatasheetModal = ({ open, onOpenChange }: UploadDatasheetModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userCategories, hasRestrictions, getCategoryIds, loading: categoriesLoading } = useUserCategories();

  // Get allowed categories based on user's product categories
  const allowedCategories = useMemo(() => {
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

  const [name, setName] = useState("");
  const [category, setCategory] = useState<DatasheetCategory>((allowedCategories[0] as DatasheetCategory) || "generator");
  const [file, setFile] = useState<File | null>(null);
  const [itemId, setItemId] = useState<string>("none");

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ['inventory-items-for-datasheet', hasRestrictions, userCategories],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select('id, name, category_id')
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      if (!name) throw new Error("Please enter a name");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${category}/${Date.now()}_${name}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('datasheets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('technical_datasheets')
        .insert({
          file_name: name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          inventory_item_id: itemId && itemId !== "none" ? itemId : null,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-datasheets'] });
      toast({
        title: "Success",
        description: "Datasheet uploaded successfully",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setCategory("generator");
    setFile(null);
    setItemId("none");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: "Invalid file",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Technical Datasheet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Datasheet Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CAT 3516 Generator Specifications"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DatasheetCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(!hasRestrictions || allowedCategories.includes('generator')) && (
                  <SelectItem value="generator">Generator</SelectItem>
                )}
                {(!hasRestrictions || allowedCategories.includes('equipment')) && (
                  <SelectItem value="equipment">Equipment</SelectItem>
                )}
                {(!hasRestrictions || allowedCategories.includes('tractor')) && (
                  <SelectItem value="tractor">Tractor</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item">Link to Inventory Item (Optional)</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF File *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};