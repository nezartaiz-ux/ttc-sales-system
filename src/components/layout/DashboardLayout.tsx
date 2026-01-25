import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { OnboardingTutorial, useOnboarding } from "@/components/onboarding/OnboardingTutorial";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { showTutorial, openTutorial, closeTutorial } = useOnboarding(user?.id);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onShowTutorial={openTutorial}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      
      {/* Onboarding Tutorial Modal */}
      <OnboardingTutorial isOpen={showTutorial} onClose={closeTutorial} />
    </div>
  );
};
