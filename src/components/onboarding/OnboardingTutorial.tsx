import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Truck,
  ClipboardList
} from 'lucide-react';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: 'Welcome to Tehama Sales System',
    description: 'This comprehensive system helps you manage all aspects of your sales operations. Let\'s take a quick tour of the main features.',
    icon: Home,
    color: 'bg-primary',
  },
  {
    title: 'Customer Management',
    description: 'Manage all your customers in one place. Add new customers, track their purchase history, credit limits, and contact information.',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    title: 'Inventory & Stock',
    description: 'Keep track of your products, stock levels, and pricing. The system alerts you when stock is low and helps manage your categories.',
    icon: Package,
    color: 'bg-green-500',
  },
  {
    title: 'Quotations',
    description: 'Create professional quotations for your customers. Track their status (draft, sent, accepted, rejected) and easily convert them to invoices.',
    icon: FileText,
    color: 'bg-yellow-500',
  },
  {
    title: 'Purchase Orders',
    description: 'Manage your supplier orders efficiently. Create POs, track deliveries, and keep your inventory stocked.',
    icon: ShoppingCart,
    color: 'bg-purple-500',
  },
  {
    title: 'Sales Invoices',
    description: 'Generate and manage sales invoices. Support for both cash and credit sales with automatic calculations.',
    icon: Receipt,
    color: 'bg-orange-500',
  },
  {
    title: 'Delivery Notes',
    description: 'Create and track delivery notes for your shipments. Link them to invoices and track delivery status.',
    icon: ClipboardList,
    color: 'bg-teal-500',
  },
  {
    title: 'Suppliers',
    description: 'Manage your supplier database. Track contact information, orders, and maintain strong supplier relationships.',
    icon: Truck,
    color: 'bg-indigo-500',
  },
  {
    title: 'Reports & Analytics',
    description: 'Generate comprehensive reports on sales, inventory, quotations, and more. Export to PDF or print directly.',
    icon: BarChart3,
    color: 'bg-pink-500',
  },
  {
    title: 'Settings & Permissions',
    description: 'Administrators can manage users, roles, and permissions. Control who has access to what in the system.',
    icon: Settings,
    color: 'bg-gray-500',
  },
];

export const OnboardingTutorial = ({ isOpen, onClose }: OnboardingTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const currentTutorial = tutorialSteps[currentStep];
  const IconComponent = currentTutorial.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 ${currentTutorial.color} rounded-full flex items-center justify-center`}>
              <IconComponent className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl">{currentTutorial.title}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {currentTutorial.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 py-4">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-primary w-6' 
                  : 'bg-muted hover:bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleSkip} className="order-3 sm:order-1">
            Skip Tutorial
          </Button>
          <div className="flex gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              {isLastStep ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage onboarding state
export const useOnboarding = (userId: string | undefined) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [canShowTutorial, setCanShowTutorial] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `onboarding_count_${userId}`;
    const countStr = localStorage.getItem(storageKey);
    const count = countStr ? parseInt(countStr, 10) : 0;

    // Show tutorial only for first 2 logins
    if (count < 2) {
      setShowTutorial(true);
      localStorage.setItem(storageKey, String(count + 1));
    }
    
    setCanShowTutorial(true);
  }, [userId]);

  const openTutorial = () => setShowTutorial(true);
  const closeTutorial = () => setShowTutorial(false);

  return {
    showTutorial,
    canShowTutorial,
    openTutorial,
    closeTutorial,
  };
};
