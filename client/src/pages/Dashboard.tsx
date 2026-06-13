/**
 * Dashboard Page
 *
 * Main dashboard showing all available features and tools
 * Provides a comprehensive overview of the platform capabilities
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { SignIn } from '@clerk/clerk-react';
import { FeatureDiscoveryDashboard } from '@/components/FeatureDiscoveryDashboard';
import { ComplianceNotificationsPanel } from '@/components/ComplianceNotificationsPanel';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { ReportBuilder } from '@/components/ReportBuilder';
import { NotificationCenter } from '@/components/NotificationCenter';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { TrainingExamplesPanel } from '@/components/TrainingExamplesPanel';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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

function OrgTrainingStatsWidget() {
  const { data: stats, isLoading } = trpc.organization.getOrgTrainingStats.useQuery();
  const { data: exportData, refetch: doExport, isFetching: isExporting } =
    trpc.organization.exportOrgTrainingData.useQuery(undefined, { enabled: false });

  const handleExport = async () => {
    const result = await doExport();
    if (result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `org-training-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Training data exported.');
    }
  };

  if (isLoading) return null;
  if (!stats || stats.count === 0) return null;

  const PLAN_TYPE_LABELS: Record<string, string> = {
    floor_plan: 'Floor Plan',
    structural: 'Structural',
    industrial: 'Industrial',
    residential_multi_unit: 'Multi-Unit Residential',
    residential_single_family: 'Single Family',
    commercial_office: 'Commercial Office',
    institutional: 'Institutional',
    mixed_use: 'Mixed Use',
    auto: 'General',
  };

  return (
    <div className="mt-8 border border-border rounded-lg p-6 bg-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Your Organization's Training Data</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Model accuracy improves with each correction</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
        >
          {isExporting ? 'Exporting…' : 'Export Training Data'}
        </Button>
      </div>
      <div className="border-t border-border pt-4 space-y-2">
        {stats.byPlanType.map((row: any) => (
          <div key={row.planType} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {PLAN_TYPE_LABELS[row.planType] ?? row.planType}
            </span>
            <span className="font-medium tabular-nums">{Number(row.count)} corrections</span>
          </div>
        ))}
        <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-semibold">
          <span>Total</span>
          <span>{stats.count} corrections</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [showWizard, setShowWizard] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);

  // Redirect free users to billing on first visit (once per browser)
  useEffect(() => {
    if (user?.role === 'free') {
      const seen = localStorage.getItem('cc_billing_seen');
      if (!seen) {
        localStorage.setItem('cc_billing_seen', '1');
        navigate('/billing');
      }
    }
  }, [user?.role]);

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
            </div>
          </div>
        </div>

        {/* Home Report CTA — visible to free and home_user roles */}
        {(user?.role === 'free' || user?.role === 'home_user') && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-blue-900">New to CodeComply?</p>
              <p className="text-sm text-blue-700">
                Get a plain-language permit compliance check for your home project — $29, results in minutes.
              </p>
            </div>
            <Button
              onClick={() => navigate('/home')}
              className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              Get a Report — $29
            </Button>
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="mb-8">
          <LegalDisclaimerCollapsible />
        </div>

        {/* Feature Discovery Dashboard — arc carousel */}
        <FeatureDiscoveryDashboard />

        {/* Below-carousel card grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Compliance Intelligence */}
          <div className="border border-border rounded-lg p-6">
            <ComplianceNotificationsPanel />
          </div>

          {/* Quick Actions */}
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2 w-full"
                onClick={() => navigate('/drawing-analyzer')}
              >
                Analyze a Drawing
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 w-full"
                onClick={() => navigate('/projects')}
              >
                View Projects
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 w-full"
                onClick={() => navigate('/home')}
              >
                Get a Home Report ($29)
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-2 w-full"
                onClick={() => navigate('/billing')}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>

        {/* Org Training Stats — admin only */}
        {user?.role === 'admin' && <OrgTrainingStatsWidget />}

        {/* Training Examples Panel — admin only */}
        {user?.role === 'admin' && (
          <div className="mt-6">
            <TrainingExamplesPanel />
          </div>
        )}

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
