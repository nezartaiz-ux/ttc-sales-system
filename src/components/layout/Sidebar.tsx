import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  FolderOpen
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Categories", href: "/categories", icon: FolderOpen },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { name: "Sales Invoices", href: "/sales-invoices", icon: Receipt },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Sidebar = () => {
  const [currentPath] = useState(window.location.pathname);

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
      <div className="flex flex-col h-full">
        {/* Logo Section */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Tehama</h2>
              <p className="text-xs text-muted-foreground">Trade Flow</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
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
                onClick={() => window.location.pathname = item.href}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <p>Tehama Trading Co.</p>
            <p>CAT & MF Authorized Dealer</p>
          </div>
        </div>
      </div>
    </div>
  );
};