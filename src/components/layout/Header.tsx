import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Bell, Settings, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import tehamaLogo from "@/assets/tehama-logo.png";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { toast } = useToast();

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
          
          <img 
            src={tehamaLogo} 
            alt="Tehama" 
            className="h-8 object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-foreground">Tehama Trading - Trade Flow</h1>
            <p className="text-xs text-muted-foreground">CAT & Massey Ferguson Dealer</p>
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