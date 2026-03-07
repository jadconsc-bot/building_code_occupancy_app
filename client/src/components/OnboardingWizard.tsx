/**
 * Onboarding Wizard Component
 * 
 * Multi-step wizard to guide new users through:
 * 1. Creating their first project
 * 2. Selecting occupancy type
 * 3. Running their first calculation
 * 4. Viewing results and history
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  CheckCircle2,
  FolderPlus,
  Calculator,
  History,
  Zap,
} from 'lucide-react';
import { occupancyData } from '@/lib/occupancyData';

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [selectedOccupancy, setSelectedOccupancy] = useState('');

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const steps = [
    {
      title: 'Create Your First Project',
      description: 'Give your project a name to get started',
      icon: <FolderPlus className="w-8 h-8" />,
    },
    {
      title: 'Select Occupancy Type',
      description: 'Choose the building occupancy classification',
      icon: <Zap className="w-8 h-8" />,
    },
    {
      title: 'Run Your First Calculation',
      description: 'Use one of our professional calculators',
      icon: <Calculator className="w-8 h-8" />,
    },
    {
      title: 'View Your Results',
      description: 'See your calculation history and results',
      icon: <History className="w-8 h-8" />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onComplete}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Welcome to CodeComply</DialogTitle>
          <DialogDescription>
            Let's get you started with your first building code compliance project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  index < step ? 'bg-primary' : index === step - 1 ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">{steps[step - 1].icon}</div>
              <div>
                <h3 className="text-lg font-semibold">{steps[step - 1].title}</h3>
                <p className="text-sm text-muted-foreground">{steps[step - 1].description}</p>
              </div>
            </div>

            {/* Step 1: Project Name */}
            {step === 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        placeholder="e.g., Downtown Office Building"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Give your project a descriptive name so you can easily find it later
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Occupancy Type */}
            {step === 2 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="occupancy">Occupancy Type</Label>
                      <Select value={selectedOccupancy} onValueChange={setSelectedOccupancy}>
                        <SelectTrigger id="occupancy" className="mt-2">
                          <SelectValue placeholder="Select an occupancy type..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          {occupancyData.map((group) => (
                            <SelectItem key={group.id} value={group.code}>
                              {group.code} - {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select the primary occupancy classification for your building
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Run Calculation */}
            {step === 3 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <p className="text-sm">
                      You're ready to run your first calculation! Click "Next" to access the calculators.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900">
                        💡 Tip: Start with the Occupant Load Calculator to determine how many people can occupy your building.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: View Results */}
            {step === 4 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">You're all set!</span>
                    </div>
                    <p className="text-sm">
                      All your calculations are automatically saved and signed with cryptographic signatures for legal defensibility.
                    </p>
                    <p className="text-sm">
                      Visit the Calculation History page anytime to view, verify, and export your results.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Step {step} of {steps.length}
            </div>
            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={
                  (step === 1 && !projectName) ||
                  (step === 2 && !selectedOccupancy)
                }
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Get Started <CheckCircle2 className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
