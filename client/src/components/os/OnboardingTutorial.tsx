import { useState } from "react";
import { useOS } from "@/lib/os-context";
import { X, ChevronRight, ChevronLeft, LayoutGrid, Folder, Settings, Gamepad2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  highlight?: string;
}

const steps: TutorialStep[] = [
  {
    title: "Welcome to NexusOS!",
    description: "Let's take a quick tour of your new web-based operating system. You can skip this tutorial anytime.",
    icon: LayoutGrid,
  },
  {
    title: "Start Menu",
    description: "Click the grid icon in the bottom-left corner to open the Start Menu. Here you can find and launch all your apps.",
    icon: LayoutGrid,
    highlight: "start-menu",
  },
  {
    title: "Desktop Icons",
    description: "Double-click icons on your desktop to quickly open apps. Right-click the desktop to add widgets and customize your experience.",
    icon: Folder,
  },
  {
    title: "Settings",
    description: "Customize your NexusOS experience! Change themes, wallpapers, sounds, and save your preferences as theme profiles.",
    icon: Settings,
  },
  {
    title: "Apps & Games",
    description: "Explore the App Store for new apps and games. From productivity tools to classic games, there's something for everyone!",
    icon: Gamepad2,
  },
  {
    title: "You're All Set!",
    description: "Enjoy using NexusOS! Right-click the desktop to add widgets, or explore the Start Menu to discover all available apps.",
    icon: Check,
  },
];

export function OnboardingTutorial() {
  const { hasSeenOnboarding, setHasSeenOnboarding, addNotification } = useOS();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(!hasSeenOnboarding);
  
  if (!isVisible) return null;
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    setIsVisible(false);
    setHasSeenOnboarding(true);
  };
  
  const handleComplete = () => {
    setIsVisible(false);
    setHasSeenOnboarding(true);
    addNotification("Welcome!", "Enjoy using NexusOS. Right-click the desktop to add widgets!", "success");
  };
  
  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" data-testid="onboarding-overlay">
      <div className="relative w-full max-w-md mx-4 bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
          data-testid="btn-skip-onboarding"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Icon className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">{step.title}</h2>
          <p className="text-white/70 mb-8 leading-relaxed">{step.description}</p>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep 
                    ? "w-8 bg-blue-500" 
                    : index < currentStep 
                      ? "w-1.5 bg-blue-500/50"
                      : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
                data-testid="btn-prev-step"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              data-testid="btn-next-step"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Check className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
