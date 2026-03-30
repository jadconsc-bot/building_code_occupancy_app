/**
 * ProjectTabView - Professional Compliance Dashboard
 * 
 * Single project detail view showing:
 * - Status bar (project name, address, compliance badge)
 * - Critical findings (occupancy, egress, travel distance)
 * - Context-aware action button
 * 
 * Architecture: Immutable props, deterministic logic, legally defensible
 * Per PROJECT_TAB_SPECIFICATION v1.0
 */

import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { AlertCircle, ChevronLeft } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ComplianceStatus = 'PASS' | 'FAIL' | 'IN_REVIEW' | 'UNKNOWN';

interface ProjectTabViewProps {
  readonly projectId: string;
  readonly onNavigate?: (route: string, params?: Record<string, any>) => void;
  readonly onBack?: () => void;
}

interface StatusBarProps {
  readonly name: string;
  readonly address: string;
  readonly codeEdition: string;
  readonly status: ComplianceStatus;
  readonly isLoading?: boolean;
  readonly error?: Error | null;
}

interface FindingsSummaryProps {
  readonly occupancyCurrent: number | null;
  readonly occupancyMax: number | null;
  readonly egressProvided: number | null;
  readonly egressRequired: number | null;
  readonly travelDistance: number | null;
  readonly isLoading?: boolean;
  readonly error?: Error | null;
}

interface ActionButtonProps {
  readonly projectId: string;
  readonly hasPlan: boolean;
  readonly hasFindings: boolean;
  readonly isLoading?: boolean;
  readonly error?: Error | null;
  readonly onNavigate: (route: string, params?: Record<string, any>) => void;
}

// ============================================================================
// PURE FUNCTIONS - Deterministic, no side effects
// ============================================================================

/**
 * Get badge configuration based on compliance status
 * Immutable, pure function
 */
const getBadgeConfig = (status: ComplianceStatus) => {
  const config: Record<ComplianceStatus, { bg: string; text: string; label: string }> = {
    PASS: { bg: '#10B981', text: 'white', label: 'PASS' },
    FAIL: { bg: '#EF4444', text: 'white', label: 'FAIL' },
    IN_REVIEW: { bg: '#FBBF24', text: '#78350F', label: 'IN REVIEW' },
    UNKNOWN: { bg: '#D1D5DB', text: '#374151', label: '—' },
  };
  return config[status] || config.UNKNOWN;
};

/**
 * Determine if occupancy is within limits
 */
const isOccupancyOK = (current: number | null, max: number | null): boolean | null => {
  if (current === null || max === null) return null;
  return current < max;
};

/**
 * Determine if egress requirements are met
 */
const isEgressOK = (provided: number | null, required: number | null): boolean | null => {
  if (provided === null || required === null) return null;
  return provided >= required;
};

/**
 * Determine if travel distance is within limits (40m)
 */
const isTravelDistanceOK = (actual: number | null, limit: number = 40): boolean | null => {
  if (actual === null) return null;
  return actual <= limit;
};

/**
 * Get indicator color (green = OK, red = violation)
 */
const getIndicatorColor = (isOK: boolean | null): string => {
  if (isOK === null) return '#D1D5DB'; // Gray for unknown
  return isOK ? '#10B981' : '#EF4444'; // Green or red
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * StatusBar - Project metadata + compliance badge
 * 88px height, immutable props
 */
const StatusBar: React.FC<StatusBarProps> = ({
  name,
  address,
  codeEdition,
  status,
  isLoading,
  error,
}) => {
  const badgeConfig = getBadgeConfig(status);

  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        {/* Left: Project Info */}
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-900">
            {isLoading ? '—' : name}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isLoading ? '—' : address}
          </p>
        </div>

        {/* Center: Code Edition */}
        <div className="mx-4 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
          {codeEdition}
        </div>

        {/* Right: Compliance Badge */}
        <div
          className="px-3 py-2 rounded font-bold text-sm whitespace-nowrap"
          style={{
            backgroundColor: badgeConfig.bg,
            color: badgeConfig.text,
          }}
        >
          {badgeConfig.label}
        </div>
      </div>
    </div>
  );
};

/**
 * MetricRow - Single finding metric with status indicator
 */
const MetricRow: React.FC<{
  label: string;
  value: string;
  isOK: boolean | null;
}> = ({ label, value, isOK }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-b-0">
    <div>
      <p className="text-xs font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-600">{value}</p>
    </div>
    <div
      className="w-4 h-4 rounded-full flex-shrink-0"
      style={{
        backgroundColor: getIndicatorColor(isOK),
      }}
    />
  </div>
);

/**
 * FindingsSummary - Critical findings panel
 * Shows occupancy, egress, travel distance with status indicators
 */
const FindingsSummary: React.FC<FindingsSummaryProps> = ({
  occupancyCurrent,
  occupancyMax,
  egressProvided,
  egressRequired,
  travelDistance,
  isLoading,
  error,
}) => {
  const occupancyOK = isOccupancyOK(occupancyCurrent, occupancyMax);
  const egressOK = isEgressOK(egressProvided, egressRequired);
  const travelOK = isTravelDistanceOK(travelDistance);

  if (error) {
    return (
      <div className="bg-white border border-border rounded-lg p-4 text-center">
        <p className="text-xs text-gray-500">Data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <MetricRow
        label="Occupancy Load"
        value={
          occupancyCurrent != null && occupancyMax != null
            ? `${occupancyCurrent} / ${occupancyMax} persons`
            : '— / —'
        }
        isOK={occupancyOK}
      />
      <MetricRow
        label="Egress Doors"
        value={
          egressProvided != null && egressRequired != null
            ? `${egressProvided} / ${egressRequired} required`
            : '— / —'
        }
        isOK={egressOK}
      />
      <MetricRow
        label="Travel Distance"
        value={
          travelDistance != null
            ? `${travelDistance}m / 40m limit`
            : '—m / 40m'
        }
        isOK={travelOK}
      />
    </div>
  );
};

/**
 * ActionButton - Context-aware button for next action
 * Text changes based on project state
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  projectId,
  hasPlan,
  hasFindings,
  isLoading,
  error,
  onNavigate,
}) => {
  // Determine button state based on project state
  let buttonText = 'Upload Floor Plan';
  let buttonAction = () => onNavigate(`/project/${projectId}/drawing-analyzer`, { mode: 'upload' });

  if (hasPlan && hasFindings) {
    buttonText = 'Review Findings';
    buttonAction = () => onNavigate(`/project/${projectId}/compliance`);
  } else if (hasPlan && !hasFindings) {
    buttonText = 'View Full Report';
    buttonAction = () => onNavigate(`/project/${projectId}/report`);
  }

  if (error) {
    buttonText = 'Retry';
    buttonAction = () => window.location.reload();
  }

  return (
    <button
      onClick={buttonAction}
      disabled={isLoading}
      className="w-full h-10 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {isLoading ? (
        <>
          <span className="inline-block animate-spin mr-2">⟳</span>
          Loading...
        </>
      ) : (
        buttonText
      )}
    </button>
  );
};

/**
 * ErrorAlert - Dismissible error notification
 */
const ErrorAlert: React.FC<{
  message: string;
  onDismiss: () => void;
  onRetry: () => void;
}> = ({ message, onDismiss, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-red-900">{message}</p>
      <div className="flex gap-2 mt-2">
        <button
          onClick={onRetry}
          className="text-xs text-red-700 hover:text-red-900 font-medium underline"
        >
          Retry
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-red-700 hover:text-red-900 font-medium underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * ProjectTabView - Main container
 * Orchestrates data fetching and renders sub-components
 */
export const ProjectTabView: React.FC<ProjectTabViewProps> = ({
  projectId,
  onNavigate = () => {},
  onBack,
}) => {
  const [errorDismissed, setErrorDismissed] = useState(false);

  // Fetch all data in parallel using React Query
  const [projectQuery, complianceQuery, drawingQuery] = useQueries({
    queries: [
      {
        queryKey: ['project', projectId],
        queryFn: async () => {
          // Mock implementation - replace with actual tRPC call
          // const result = await trpc.project.getById.query({ projectId });
          return {
            id: projectId,
            name: 'Sample Project',
            address: '123 Main St, Calgary, AB, Canada',
            code_edition: 'NBC 2025',
            plan_id: 'plan-123',
            created_at: new Date(),
            last_modified: new Date(),
          };
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ['compliance', projectId],
        queryFn: async () => {
          // Mock implementation - replace with actual tRPC call
          // const result = await trpc.compliance.getStatus.query({ projectId });
          return {
            overall_status: 'PASS' as ComplianceStatus,
            active_findings_count: 0,
            last_audit_timestamp: new Date(),
          };
        },
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['drawing', projectId],
        queryFn: async () => {
          // Mock implementation - replace with actual tRPC call
          // const result = await trpc.drawing.getAnalysis.query({ projectId });
          return {
            occupancy_load: 45,
            occupancy_max: 50,
            egress_provided: 2,
            egress_required: 2,
            travel_distance_max: 35,
          };
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!projectQuery.data?.plan_id, // Skip if no plan
      },
    ],
  });

  // Determine overall loading and error states
  const hasError =
    projectQuery.isError ||
    complianceQuery.isError ||
    (projectQuery.data?.plan_id && drawingQuery.isError);

  const isLoading =
    projectQuery.isLoading ||
    complianceQuery.isLoading ||
    (projectQuery.data?.plan_id && drawingQuery.isLoading);

  // Handle 404
  if (projectQuery.isError && (projectQuery.error as any)?.code === 'NOT_FOUND') {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-medium">Project not found</p>
        <button
          onClick={() => onNavigate('/projects')}
          className="mt-2 text-blue-600 hover:text-blue-700 underline text-sm"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      )}

      {/* Error Alert */}
      {hasError && !errorDismissed && (
        <ErrorAlert
          message="Unable to load project data. Please refresh."
          onDismiss={() => setErrorDismissed(true)}
          onRetry={() => {
            projectQuery.refetch();
            complianceQuery.refetch();
            drawingQuery.refetch();
          }}
        />
      )}

      {/* Status Bar */}
      <StatusBar
        name={projectQuery.data?.name || '—'}
        address={projectQuery.data?.address || '—'}
        codeEdition={projectQuery.data?.code_edition || 'NBC 2025'}
        status={complianceQuery.data?.overall_status || 'UNKNOWN'}
        isLoading={projectQuery.isLoading}
        error={projectQuery.error}
      />

      {/* Critical Findings */}
      <FindingsSummary
        occupancyCurrent={drawingQuery.data?.occupancy_load ?? null}
        occupancyMax={drawingQuery.data?.occupancy_max ?? null}
        egressProvided={drawingQuery.data?.egress_provided ?? null}
        egressRequired={drawingQuery.data?.egress_required ?? null}
        travelDistance={drawingQuery.data?.travel_distance_max ?? null}
        isLoading={drawingQuery.isLoading}
        error={drawingQuery.error}
      />

      {/* Action Button */}
      <ActionButton
        projectId={projectId}
        hasPlan={!!projectQuery.data?.plan_id}
        hasFindings={(complianceQuery.data?.active_findings_count ?? 0) > 0}
        isLoading={isLoading}
        error={hasError ? new Error('Data unavailable') : null}
        onNavigate={onNavigate}
      />
    </div>
  );
};

export default ProjectTabView;
