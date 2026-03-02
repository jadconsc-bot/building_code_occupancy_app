/**
 * Onboarding Tutorial Component
 * 
 * Guided walkthrough for first-time users showing how to:
 * 1. Create a project
 * 2. Run compliance analysis
 * 3. Generate reports
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, ArrowRight, X, Play } from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  details: string;
  action: string;
  videoUrl?: string;
  estimatedTime: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Create Your First Project',
    description: 'Learn how to set up a new building project',
    details: `
      Projects are the foundation of CodeComply. Each project represents a building or space you want to analyze for code compliance.
      
      Steps:
      1. Click "Projects" in the main navigation
      2. Click "Create New Project" button
      3. Enter project name (e.g., "Downtown Office Building")
      4. Select building occupancy type (e.g., "Office", "Residential")
      5. Add optional description and location details
      6. Click "Create Project"
      
      Your project is now ready for compliance analysis!
    `,
    action: 'Create Project',
    estimatedTime: '5 minutes',
  },
  {
    id: 2,
    title: 'Run Compliance Analysis',
    description: 'Analyze your building for code compliance',
    details: `
      Once you have a project, you can analyze it for compliance with building codes.
      
      Steps:
      1. Open your project from the Projects list
      2. Click "Run Compliance Analysis" button
      3. Select the analysis type:
         - Structural Analysis
         - Egress & Fire Safety
         - Accessibility Requirements
         - Electrical Systems
         - Plumbing Systems
      4. Upload building plans or drawings (optional)
      5. Click "Analyze" to start the analysis
      
      CodeComply will check your building against NBC 2025 standards and provide detailed results.
    `,
    action: 'Run Analysis',
    estimatedTime: '10 minutes',
  },
  {
    id: 3,
    title: 'Review Analysis Results',
    description: 'Understand compliance findings and recommendations',
    details: `
      After analysis completes, you'll see detailed results showing:
      
      Compliance Status:
      - ✓ Compliant areas (green)
      - ⚠ Issues requiring attention (yellow)
      - ✗ Critical violations (red)
      
      For each issue:
      - Issue code and description
      - Severity level (Low, Medium, High, Critical)
      - Applicable building code section
      - Recommended remediation
      
      Click on any issue to see detailed guidance and references.
    `,
    action: 'View Results',
    estimatedTime: '5 minutes',
  },
  {
    id: 4,
    title: 'Generate Compliance Report',
    description: 'Create professional compliance documentation',
    details: `
      Generate formal compliance reports for documentation, submissions, or stakeholder communication.
      
      Steps:
      1. From your project, click "Generate Report"
      2. Select report type:
         - Executive Summary (1-2 pages)
         - Detailed Analysis (5-10 pages)
         - Full Compliance Audit (15+ pages)
      3. Choose export format:
         - PDF (for printing/sharing)
         - JSON (for data integration)
      4. Add optional cover page with:
         - Project name
         - Client name
         - Date
         - Your company details
      5. Click "Generate" to create the report
      
      Reports include all findings, recommendations, and code references.
    `,
    action: 'Generate Report',
    estimatedTime: '5 minutes',
  },
  {
    id: 5,
    title: 'Track Changes Over Time',
    description: 'Monitor compliance improvements and project history',
    details: `
      CodeComply automatically tracks all analyses and changes to your projects.
      
      Features:
      - View analysis history with timestamps
      - Compare results between different analysis dates
      - Track remediation progress
      - Export historical data
      
      In your project dashboard:
      1. Click "Analysis History" tab
      2. Select any previous analysis to view details
      3. Click "Compare" to see changes since last analysis
      4. Download historical reports as needed
      
      This helps you document compliance improvements over time.
    `,
    action: 'View History',
    estimatedTime: '5 minutes',
  },
];

interface OnboardingTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const isCompleted = completedSteps.includes(step.id);
  const progress = (completedSteps.length / TUTORIAL_STEPS.length) * 100;

  const handleStepComplete = () => {
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps([...completedSteps, step.id]);
    }
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowDetails(false);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowDetails(false);
    }
  };

  const handleSkipTutorial = () => {
    onSkip?.();
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Getting Started with CodeComply</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkipTutorial}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-muted-foreground mb-4">
          Complete this 5-step tutorial to master CodeComply (estimated time: 30 minutes)
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {completedSteps.length} of {TUTORIAL_STEPS.length} steps completed
        </p>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {TUTORIAL_STEPS.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentStep(idx);
              setShowDetails(false);
            }}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              currentStep === idx
                ? 'border-primary bg-primary/5'
                : completedSteps.includes(s.id)
                ? 'border-green-500 bg-green-50'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {completedSteps.includes(s.id) && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              <span className="text-sm font-medium">Step {s.id}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{s.title}</p>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
              <CardDescription className="text-base">{step.description}</CardDescription>
            </div>
            {isCompleted && (
              <Badge className="bg-green-600 text-white">Completed</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!showDetails ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">{step.details.split('\n')[0]}</p>
              <Button
                onClick={() => setShowDetails(true)}
                variant="outline"
                className="w-full"
              >
                <Play className="w-4 h-4 mr-2" />
                View Step Details
              </Button>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ⏱️ Estimated time: {step.estimatedTime}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg whitespace-pre-wrap text-sm font-mono text-foreground">
                {step.details}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Hide Details
                </Button>
                <Button
                  onClick={handleStepComplete}
                  disabled={isCompleted}
                  className="flex-1"
                >
                  {isCompleted ? '✓ Completed' : 'Mark as Complete'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          className="flex-1"
        >
          ← Previous
        </Button>

        <div className="flex gap-2 flex-1">
          <Button
            onClick={handleSkipTutorial}
            variant="ghost"
            className="flex-1"
          >
            Skip Tutorial
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1"
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? (
              <>
                Complete Tutorial <CheckCircle2 className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tips Section */}
      <Card className="mt-8 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">💡 Pro Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Save your projects regularly - they're automatically backed up to the cloud</p>
          <p>• Use the "Compare" feature to track compliance improvements over time</p>
          <p>• Export reports in PDF format for easy sharing with stakeholders</p>
          <p>• Check the "Rule Management" section to customize which codes apply to your projects</p>
          <p>• Contact support if you need help with any analysis results</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Onboarding Dialog - Wrapper for displaying tutorial in a modal
 */
interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome to CodeComply</DialogTitle>
          <DialogDescription>
            Let's get you started with building code compliance analysis
          </DialogDescription>
        </DialogHeader>
        <OnboardingTutorial
          onComplete={() => onOpenChange(false)}
          onSkip={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
