import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  tourId: string;
}

export const GuidedTour = ({ steps, isActive, onComplete, tourId }: GuidedTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateTargetPosition = useCallback(() => {
    if (!isActive || steps.length === 0) return;
    
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.target);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      setIsVisible(true);
      
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setIsVisible(false);
    }
  }, [currentStep, steps, isActive]);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      setIsVisible(false);
      return;
    }

    // Small delay to let the page render
    const timer = setTimeout(updateTargetPosition, 300);
    
    // Update position on resize/scroll
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition, true);
    };
  }, [isActive, updateTargetPosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isActive || !isVisible || !targetRect || steps.length === 0) return null;

  const step = steps[currentStep];
  const placement = step.placement || 'bottom';
  const isLastStep = currentStep === steps.length - 1;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const padding = 12;
    const tooltipWidth = 320;
    
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = targetRect.top - padding - 8;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + padding;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, top);

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10001,
    };
  };

  return createPortal(
    <>
      {/* Overlay with spotlight */}
      <div 
        className="fixed inset-0 z-[10000] pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, rgba(0,0,0,0.7) ${Math.max(targetRect.width, targetRect.height) / 2 + 60}px)`
        }}
      />
      
      {/* Highlight border around target */}
      <div
        className="fixed z-[10000] pointer-events-none rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-background"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
      />

      {/* Tooltip */}
      <div
        style={getTooltipStyle()}
        className={cn(
          "bg-card border border-border rounded-lg shadow-2xl p-4 animate-in fade-in-0 zoom-in-95 duration-200"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-foreground">{step.title}</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-2"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground mb-4">{step.content}</p>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-3">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentStep 
                  ? "bg-primary w-6" 
                  : index < currentStep 
                    ? "bg-primary/50 w-3" 
                    : "bg-muted w-3"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? 'Done' : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
