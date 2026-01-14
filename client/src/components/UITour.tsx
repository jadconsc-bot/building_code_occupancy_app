import { useUITour } from "@/contexts/UITourContext";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const tourSteps = [
  {
    title: "Welcome to Building Code Occupancy Classifier",
    description: "Let's take a quick tour to help you navigate the app using our color-coded system.",
    highlight: null,
    color: null,
  },
  {
    title: "Navigation & Search (Blue)",
    description: "The left sidebar with light blue background is your navigation hub. Search for building types, browse occupancy classifications, and access your favorites here.",
    highlight: "sidebar",
    color: "var(--nav-bg)",
  },
  {
    title: "Occupancy Codes (Orange)",
    description: "Orange badges and headers identify occupancy classifications (A-1, A-2, etc.). This color helps you quickly spot code references throughout the app.",
    highlight: "occupancy",
    color: "var(--occupancy-badge)",
  },
  {
    title: "Requirements (Green)",
    description: "Green sections highlight building requirements, compliance criteria, and safety standards. Look for green headers when checking code requirements.",
    highlight: "requirements",
    color: "var(--requirements-header)",
  },
  {
    title: "Fire Safety (Red)",
    description: "Red sections indicate fire separation requirements, fire ratings, and life safety features. Critical safety information is always marked in red.",
    highlight: "fire",
    color: "var(--fire-header)",
  },
  {
    title: "Construction & Calculators (Purple/Teal)",
    description: "Purple marks construction limits and structural requirements. The teal-blue gradient tabs give you access to 25+ NBC calculators and design tools.",
    highlight: "construction",
    color: "var(--construction-header)",
  },
];

export function UITour() {
  const { isActive, currentStep, nextStep, skipTour, totalSteps } = useUITour();

  if (!isActive) return null;

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-300" onClick={skipTour} />
      
      {/* Tour Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="border-2 shadow-2xl" style={{ borderColor: step.color || 'var(--border)' }}>
          <CardHeader className="pb-3" style={{ backgroundColor: step.color ? `${step.color}20` : 'transparent' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Step {currentStep + 1} of {totalSteps}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipTour}
                className="h-8 w-8 -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-foreground leading-relaxed mb-6">
              {step.description}
            </p>
            
            {step.color && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded border" style={{ backgroundColor: `${step.color}15`, borderColor: step.color }}>
                <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
                <span className="text-xs font-medium" style={{ color: step.color }}>
                  This color represents {step.title.split('(')[0].trim()}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={skipTour}
                className="flex-1"
              >
                Skip Tour
              </Button>
              <Button
                onClick={nextStep}
                className="flex-1 gap-2"
                style={{ backgroundColor: step.color || 'var(--primary)', color: 'white' }}
              >
                {currentStep < totalSteps - 1 ? (
                  <>
                    Next <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
            
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === currentStep ? (step.color || 'var(--primary)') : 'var(--muted)',
                    transform: i === currentStep ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
