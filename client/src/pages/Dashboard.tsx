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
import { RuleManagementAccess } from '@/components/RuleManagementAccess';
import { CalculationComparison } from '@/components/CalculationComparison';
import { NotificationCenter } from '@/components/NotificationCenter';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { Button } from '@/components/ui/button';


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
          <p className="text-sm text-muted-foreground">Please log in to continue.</p>
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
              <NotificationCenter />
              <Button onClick={() => setShowWizard(true)} variant="outline">
                Start Tutorial
              </Button>
              <Button onClick={() => setShowReportBuilder(true)}>
                Generate Report
              </Button>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mb-8">
          <LegalDisclaimer />
        </div>

        {/* Feature Discovery Dashboard */}
        <FeatureDiscoveryDashboard />

        {/* Rule Management Access */}
        <RuleManagementAccess userRole={user?.role as 'admin' | 'editor' | 'user'} />

        {/* Calculation Comparison */}
        <CalculationComparison calculations={[]} />

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
