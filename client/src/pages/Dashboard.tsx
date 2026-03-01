/**
 * Dashboard Page
 * 
 * Main dashboard showing all available features and tools
 * Provides a comprehensive overview of the platform capabilities
 */

import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { FeatureDiscoveryDashboard } from '@/components/FeatureDiscoveryDashboard';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { ReportBuilder } from '@/components/ReportBuilder';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/const';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to CodeComply</h1>
          <p className="text-muted-foreground mb-6">
            Professional building code compliance tools for architects, engineers, and inspectors
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Login to Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <div className="container mx-auto px-4 py-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
              <p className="text-lg text-muted-foreground">
                Explore all available features and tools for building code compliance
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowWizard(true)} variant="outline">
                Start Tutorial
              </Button>
              <Button onClick={() => setShowReportBuilder(true)}>
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Feature Discovery Dashboard */}
        <FeatureDiscoveryDashboard />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            All calculations are performed on secure servers with cryptographic signatures and immutable audit trails
          </p>
          <p className="mt-2">
            Compliant with NBC 2025 • Enterprise-grade security • GDPR ready
          </p>
        </div>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard open={showWizard} onComplete={() => setShowWizard(false)} />

      {/* Report Builder */}
      <ReportBuilder open={showReportBuilder} onClose={() => setShowReportBuilder(false)} />
    </div>
  );
}
