import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Truck,
  BarChart3,
  Settings,
  FolderOpen,
  BookOpen,
  ClipboardList,
  Image,
  X,
  Zap,
  Tractor
} from "lucide-react";
import { useUserCategories } from "@/hooks/useUserCategories";
import { useUserPermissions, SystemModule } from "@/hooks/useUserPermissions";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, module: null },
  { name: "Customers", href: "/customers", icon: Users, module: 'customers' },
  { name: "Suppliers", href: "/suppliers", icon: Truck, module: 'suppliers' },
  { name: "Stock", href: "/inventory", icon: Package, module: 'inventory' },
  { name: "Categories", href: "/categories", icon: FolderOpen, module: 'categories' },
  { name: "Quotations", href: "/quotations", icon: FileText, module: 'quotations' },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, module: 'purchase_orders' },
  { name: "Sales Invoices", href: "/sales-invoices", icon: Receipt, module: 'sales_invoices' },
  { name: "Delivery Notes", href: "/delivery-notes", icon: ClipboardList, module: 'delivery_notes' },
  { name: "Technical Datasheets", href: "/technical-datasheets", icon: BookOpen, module: null },
  { name: "Image Gallery", href: "/image-gallery", icon: Image, module: 'image_gallery' },
  { name: "Reports", href: "/reports", icon: BarChart3, module: 'reports' },
  { name: "Settings", href: "/settings", icon: Settings, module: 'settings' },
];

// Category-specific configurations
const categoryConfig: Record<string, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  'مولدات كهربائية': { 
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  'معدات ثقيلة': { 
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  'حراثات زراعية': { 
    icon: Tractor,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({ isOpen = true, onClose }: SidebarProps) => {
  const location = useLocation();
  const { userCategories, hasRestrictions, isAdmin, loading } = useUserCategories();
  const { canView, loading: permissionsLoading } = useUserPermissions();

  // Get category display info
  const getCategoryInfo = () => {
    if (isAdmin) return null;
    if (!hasRestrictions || userCategories.length === 0) return null;
    
    if (userCategories.length === 1) {
      const categoryName = userCategories[0]?.name || '';
      const config = categoryConfig[categoryName];
      return {
        name: categoryName,
        icon: config?.icon || Package,
        color: config?.color || 'text-primary',
        bgColor: config?.bgColor || 'bg-primary/10'
      };
    }

    // Multiple categories
    return {
      name: `${userCategories.length} Categories`,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    };
  };

  const categoryInfo = getCategoryInfo();

  // Filter navigation based on user permissions
  const filteredNavigation = navigation.filter(item => {
    // Always show Dashboard, Technical Datasheets (no module)
    if (!item.module) return true;
    // Admin sees everything
    if (isAdmin) return true;
    // Check permission for the module
    return canView(item.module as SystemModule);
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Tehama</h2>
                  <p className="text-xs text-muted-foreground">Sales System</p>
                </div>
              </div>
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Category Indicator */}
          {!loading && categoryInfo && (
            <div className="px-4 py-3 border-b border-border">
              <div className={cn("flex items-center gap-2 p-2 rounded-lg", categoryInfo.bgColor)}>
                <categoryInfo.icon className={cn("w-4 h-4", categoryInfo.color)} />
                <span className={cn("text-sm font-medium", categoryInfo.color)}>
                  {categoryInfo.name}
                </span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10",
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  asChild
                  onClick={onClose}
                >
                  <Link to={item.href}>
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <p>Tehama Trading Co.</p>
              {isAdmin && (
                <Badge variant="secondary" className="mt-2">
                  System Admin
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};