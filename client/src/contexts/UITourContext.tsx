import React, { createContext, useContext, useState, useEffect } from "react";

interface UITourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  totalSteps: number;
}

const UITourContext = createContext<UITourContextType | undefined>(undefined);

export function UITourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 6;

  useEffect(() => {
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem("ui_tour_completed");
    if (!tourCompleted) {
      // Start tour automatically on first visit
      setTimeout(() => setIsActive(true), 1000);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      skipTour();
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem("ui_tour_completed", "true");
  };

  return (
    <UITourContext.Provider value={{ isActive, currentStep, startTour, nextStep, skipTour, totalSteps }}>
      {children}
    </UITourContext.Provider>
  );
}

export function useUITour() {
  const context = useContext(UITourContext);
  if (!context) {
    throw new Error("useUITour must be used within UITourProvider");
  }
  return context;
}
