/**
 * Dashboard Page
 *
 * Main dashboard showing all available features and tools
 * Provides a comprehensive overview of the platform capabilities
 */

import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { SignIn } from '@clerk/clerk-react';
import { FeatureDiscoveryDashboard } from '@/components/FeatureDiscoveryDashboard';
import { ComplianceNotificationsPanel } from '@/components/ComplianceNotificationsPanel';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { ReportBuilder } from '@/components/ReportBuilder';
import { NotificationCenter } from '@/components/NotificationCenter';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { Button } from '@/components/ui/button';

function LegalDisclaimerCollapsible() {
  const [expanded, setExpanded] = React.useState(() => {
    try { return localStorage.getItem('cc_disclaimer_expanded') === 'true'; }
    catch { return false; }
  });
  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem('cc_disclaimer_expanded', String(next)); } catch {}
  };
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-lg">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-600">⚠</span>
          <span className="text-sm font-medium text-amber-800">Legal Disclaimer & Professional Liability</span>
        </div>
        <span className="text-amber-600 text-xs">{expanded ? 'Collapse ▲' : 'Expand ▼'}</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          <LegalDisclaimer />
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center px-4">
        <SignIn routing="hash" />
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
          <LegalDisclaimerCollapsible />
        </div>

        {/* Feature Discovery Dashboard */}
        <FeatureDiscoveryDashboard />

        {/* Compliance Intelligence */}
        <div className="mt-12 border border-border rounded-lg p-6">
          <ComplianceNotificationsPanel />
        </div>

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
