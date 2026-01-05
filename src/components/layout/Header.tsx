import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Bell, Settings, Menu, Zap, Truck, Tractor } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserCategories } from "@/hooks/useUserCategories";
import tehamaLogo from "@/assets/tehama-logo.png";

interface HeaderProps {
  onMenuClick?: () => void;
}

// Category-specific configurations
const categoryConfig: Record<string, { title: string; subtitle: string; icon: React.ComponentType<any>; color: string }> = {
  'مولدات كهربائية': { 
    title: 'نظام إدارة المولدات الكهربائية', 
    subtitle: 'Electric Generators Management',
    icon: Zap,
    color: 'text-yellow-500'
  },
  'معدات ثقيلة': { 
    title: 'نظام إدارة المعدات الثقيلة', 
    subtitle: 'Heavy Equipment Management',
    icon: Truck,
    color: 'text-orange-500'
  },
  'حراثات زراعية': { 
    title: 'نظام إدارة الحراثات الزراعية', 
    subtitle: 'Agricultural Tractors Management',
    icon: Tractor,
    color: 'text-green-500'
  },
};

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { toast } = useToast();
  const { userCategories, hasRestrictions, isAdmin } = useUserCategories();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Determine title and subtitle based on user's category
  const getHeaderInfo = () => {
    if (isAdmin || !hasRestrictions || userCategories.length !== 1) {
      return {
        title: 'Tehama Trading - Trade Flow',
        subtitle: 'CAT & Massey Ferguson Dealer',
        icon: null,
        color: ''
      };
    }

    const categoryName = userCategories[0]?.name || '';
    return categoryConfig[categoryName] || {
      title: 'Tehama Trading - Trade Flow',
      subtitle: 'CAT & Massey Ferguson Dealer',
      icon: null,
      color: ''
    };
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {IconComponent ? (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted ${headerInfo.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
          ) : (
            <img 
              src={tehamaLogo} 
              alt="Tehama" 
              className="h-8 object-contain"
            />
          )}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">{headerInfo.title}</h1>
            <p className="text-xs text-muted-foreground">{headerInfo.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Settings className="h-4 w-4" />
          </Button>
          <Avatar className="hidden sm:flex">
            <AvatarFallback className="bg-primary text-primary-foreground">
              U
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" onClick={handleLogout} className="hidden sm:flex">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="sm:hidden">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};