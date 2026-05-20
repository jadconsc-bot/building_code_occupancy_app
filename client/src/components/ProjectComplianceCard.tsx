/**
 * ProjectComplianceCard - Lightweight project card for Projects list
 * 
 * Shows:
 * - Project name and address
 * - Compliance badge (PASS/FAIL/IN_REVIEW)
 * - Finding count summary
 * - Last modified date
 * 
 * Minimal data footprint - only badge + count, not full findings
 * Per PROJECT_TAB_SPECIFICATION v1.0
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

type ComplianceStatus = 'PASS' | 'FAIL' | 'IN_REVIEW' | 'UNKNOWN';

interface ProjectComplianceCardProps {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly status: ComplianceStatus;
  readonly findingsCount: number;
  readonly lastModified: Date;
  readonly onClick?: () => void;
  readonly isLoading?: boolean;
  readonly projectCode?: string;
  readonly projectNumber?: string;
}

/**
 * Get badge configuration based on compliance status
 */
const getBadgeConfig = (status: ComplianceStatus) => {
  const config: Record<ComplianceStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    PASS: {
      bg: '#10B981',
      text: 'white',
      label: 'PASS',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    FAIL: {
      bg: '#EF4444',
      text: 'white',
      label: 'FAIL',
      icon: <AlertCircle className="w-4 h-4" />,
    },
    IN_REVIEW: {
      bg: '#FBBF24',
      text: '#78350F',
      label: 'IN REVIEW',
      icon: <Clock className="w-4 h-4" />,
    },
    UNKNOWN: {
      bg: '#D1D5DB',
      text: '#374151',
      label: '—',
      icon: <Clock className="w-4 h-4" />,
    },
  };
  return config[status] || config.UNKNOWN;
};

/**
 * ProjectComplianceCard - Lightweight project card
 */
export const ProjectComplianceCard: React.FC<ProjectComplianceCardProps> = ({
  id,
  name,
  address,
  status,
  findingsCount,
  lastModified,
  onClick,
  isLoading,
  projectCode,
  projectNumber,
}) => {
  const displayCode = projectCode || projectNumber;
  const badgeConfig = getBadgeConfig(status);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Project Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {isLoading ? '—' : name}
            </h3>
            {!isLoading && displayCode && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                {displayCode}
              </span>
            )}
            <p className="text-xs text-gray-500 mt-1 truncate">
              {isLoading ? '—' : address}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">
                {isLoading ? '—' : `Modified ${format(lastModified, 'MMM d, yyyy')}`}
              </span>
            </div>
          </div>

          {/* Right: Status Badge + Findings Count */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* Compliance Badge */}
            <div
              className="px-2 py-1 rounded text-xs font-bold flex items-center gap-1 whitespace-nowrap"
              style={{
                backgroundColor: badgeConfig.bg,
                color: badgeConfig.text,
              }}
            >
              {badgeConfig.icon}
              {badgeConfig.label}
            </div>

            {/* Findings Count */}
            {findingsCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {findingsCount} finding{findingsCount !== 1 ? 's' : ''}
              </Badge>
            )}

            {/* Chevron */}
            <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectComplianceCard;
