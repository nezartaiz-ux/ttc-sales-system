import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GuidedTour } from "@/components/onboarding/GuidedTour";
import { getTourStepsForRoute } from "@/components/onboarding/tourSteps";
import { useGuidedTour, useTrackLogin } from "@/hooks/useGuidedTour";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Track login for tour system
  useTrackLogin(user?.id);
  
  // Get tour for current route
  const tourSteps = getTourStepsForRoute(location.pathname);
  const { isActive, startTour, endTour } = useGuidedTour(user?.id, location.pathname);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          onShowTutorial={startTour}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
      
      {/* Guided Tour */}
      {tourSteps.length > 0 && (
        <GuidedTour
          steps={tourSteps}
          isActive={isActive}
          onComplete={endTour}
          tourId={location.pathname}
        />
      )}
    </div>
  );
};
