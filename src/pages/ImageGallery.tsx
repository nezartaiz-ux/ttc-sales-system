import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Plus, Image as ImageIcon, Trash2, Printer, Search, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCategories } from "@/hooks/useUserCategories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UploadImageModal } from "@/components/modals/UploadImageModal";

type ImageCategory = 'generator' | 'equipment' | 'tractor';

interface EquipmentImage {
  id: string;
  name: string;
  category: ImageCategory;
  model: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const ImageGallery = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ImageCategory>('generator');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string; model: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userCategories, hasRestrictions, loading: categoriesLoading } = useUserCategories();

  // Get allowed image categories based on user's product categories
  const allowedImageCategories = useMemo(() => {
    if (!hasRestrictions) return ['generator', 'equipment', 'tractor'];
    
    const categoryNames = userCategories.map(c => c.name.toLowerCase());
    const allowed: string[] = [];
    
    // Map product category names to image categories
    categoryNames.forEach(name => {
      if (name.includes('generator') || name.includes('مولد')) allowed.push('generator');
      if (name.includes('equipment') || name.includes('معد')) allowed.push('equipment');
      if (name.includes('tractor') || name.includes('حراث')) allowed.push('tractor');
    });
    
    return [...new Set(allowed)];
  }, [userCategories, hasRestrictions]);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['equipment-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_images')
        .select('*')
        .order('model', { ascending: true });

      if (error) throw error;
      return data as EquipmentImage[];
    },
  });

  // Filter images by user's allowed categories
  const accessibleImages = useMemo(() => {
    if (!hasRestrictions) return images;
    return images.filter(img => allowedImageCategories.includes(img.category));
  }, [images, allowedImageCategories, hasRestrictions]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const image = images.find(img => img.id === id);
      if (!image) throw new Error('Image not found');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('equipment-images')
        .remove([image.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('equipment_images')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment-images'] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleView = async (filePath: string, name: string, model: string) => {
    const { data } = supabase.storage
      .from('equipment-images')
      .getPublicUrl(filePath);

    setViewingImage({ url: data.publicUrl, name, model });
  };

  const handlePrint = () => {
    if (!viewingImage) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${viewingImage.model} - ${viewingImage.name}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                display: flex; 
                flex-direction: column;
                align-items: center;
                font-family: Arial, sans-serif;
              }
              h1 { 
                font-size: 24px; 
                margin-bottom: 10px;
                color: #333;
              }
              h2 {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
              }
              img { 
                max-width: 100%; 
                max-height: 80vh;
                object-fit: contain;
              }
              @media print {
                body { padding: 0; }
                h1, h2 { page-break-after: avoid; }
              }
            </style>
          </head>
          <body>
            <h1>${viewingImage.model}</h1>
            <h2>${viewingImage.name}</h2>
            <img src="${viewingImage.url}" alt="${viewingImage.name}" onload="window.print(); window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredImages = accessibleImages.filter(img => 
    img.category === selectedCategory && 
    (searchTerm === '' || 
     img.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
     img.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Determine the default tab based on allowed categories
  const defaultCategory = useMemo(() => {
    if (allowedImageCategories.includes(selectedCategory)) return selectedCategory;
    return (allowedImageCategories[0] as ImageCategory) || 'generator';
  }, [allowedImageCategories, selectedCategory]);

  // Group images by model
  const groupedImages = filteredImages.reduce((acc, img) => {
    if (!acc[img.model]) {
      acc[img.model] = [];
    }
    acc[img.model].push(img);
    return acc;
  }, {} as Record<string, EquipmentImage[]>);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Image Gallery</h1>
            <p className="text-muted-foreground">
              Manage equipment images by model for generators, equipment, and tractors
            </p>
          </div>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload Image
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Images</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by model or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              {searchTerm && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={defaultCategory} onValueChange={(v) => setSelectedCategory(v as ImageCategory)}>
              <TabsList className={`grid w-full grid-cols-${allowedImageCategories.length || 3}`}>
                {(!hasRestrictions || allowedImageCategories.includes('generator')) && (
                  <TabsTrigger value="generator">Generators</TabsTrigger>
                )}
                {(!hasRestrictions || allowedImageCategories.includes('equipment')) && (
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                )}
                {(!hasRestrictions || allowedImageCategories.includes('tractor')) && (
                  <TabsTrigger value="tractor">Tractors</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value={defaultCategory} className="mt-6">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : Object.keys(groupedImages).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No images found for this category
                  </div>
                ) : (
                  <div className="space-y-8">
                    {Object.entries(groupedImages).map(([model, modelImages]) => (
                      <div key={model} className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">{model}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {modelImages.map((image) => {
                            const { data } = supabase.storage
                              .from('equipment-images')
                              .getPublicUrl(image.file_path);
                            
                            return (
                              <div 
                                key={image.id} 
                                className="group relative border rounded-lg overflow-hidden bg-muted/50"
                              >
                                <div className="aspect-square">
                                  <img
                                    src={data.publicUrl}
                                    alt={image.name}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => handleView(image.file_path, image.name, image.model)}
                                  />
                                </div>
                                <div className="p-2 bg-background">
                                  <p className="text-sm font-medium truncate">{image.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(image.file_size)}
                                  </p>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                  onClick={() => setDeleteId(image.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <UploadImageModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Viewer Modal */}
      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{viewingImage?.model}</DialogTitle>
                <p className="text-sm text-muted-foreground">{viewingImage?.name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 p-4 flex items-center justify-center bg-muted/50">
            {viewingImage && (
              <img
                src={viewingImage.url}
                alt={viewingImage.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ImageGallery;
