import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Bell, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import tehamaLogo from "@/assets/tehama-logo.png";

export const Header = () => {
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
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
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
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              U
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};