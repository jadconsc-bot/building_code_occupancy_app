/**
 * CodeConflictsPanel
 *
 * Displays cross-check conflicts between compliance rule outputs.
 * A conflict is two outputs that contradict each other — distinct
 * from a single-rule failure.
 *
 * Critical conflicts block permit package generation.
 * Major/minor conflicts show as warnings.
 *
 * Read-only — all values from deterministic codeConflictDetector.ts.
 * Props flow downward only — no state mutation in this component.
 */

import { XCircle, AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import type { ConflictDetectionResult, CodeConflict } from '@/lib/drawingDataExtractor';

interface CodeConflictsPanelProps {
  codeConflicts: ConflictDetectionResult;
}

const SEVERITY_DISPLAY = {
  critical: {
    icon: XCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    borderClass: 'border-l-red-500',
    label: 'Critical — Blocks Permit Package',
  },
  major: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    borderClass: 'border-l-amber-400',
    label: 'Major',
  },
  minor: {
    icon: Info,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    borderClass: 'border-l-blue-400',
    label: 'Minor',
  },
} as const;

function ConflictCard({ conflict }: { conflict: CodeConflict }) {
  const [expanded, setExpanded] = useState(conflict.severity === 'critical');
  const display = SEVERITY_DISPLAY[conflict.severity];
  const Icon = display.icon;

  return (
    <Card className={`rounded-none border-l-4 ${display.borderClass}`}>
      <CardHeader
        className="py-2 px-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Icon className={`w-4 h-4 ${display.iconClass} shrink-0`} />
            <span className="line-clamp-1">{conflict.description}</span>
          </CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs ${display.badgeClass}`}>
              {display.label}
            </Badge>
            {expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="py-2 px-4 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-muted-foreground">Value A</div>
            <div className="font-medium text-red-700">{conflict.valueA}</div>
            <div className="text-muted-foreground">Value B</div>
            <div className="font-medium text-red-700">{conflict.valueB}</div>
          </div>

          <div className="mt-2 p-2 bg-muted rounded text-xs">
            <span className="font-semibold">Resolution: </span>
            {conflict.recommendation}
          </div>

          <p className="text-xs text-muted-foreground">
            📎 {conflict.nbcRef} · {conflict.codeEdition}
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export function CodeConflictsPanel({ codeConflicts }: CodeConflictsPanelProps) {
  if (!codeConflicts || codeConflicts.conflictCount === 0) return null;

  const { conflicts, criticalCount, majorCount, minorCount, hasBlockingConflicts } = codeConflicts;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <ShieldAlert className={`w-4 h-4 ${hasBlockingConflicts ? 'text-red-500' : 'text-amber-500'}`} />
        <h3 className="text-sm font-semibold text-foreground">
          Code Conflicts
        </h3>
        {criticalCount > 0 && (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">
            {criticalCount} Critical
          </Badge>
        )}
        {majorCount > 0 && (
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
            {majorCount} Major
          </Badge>
        )}
        {minorCount > 0 && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
            {minorCount} Minor
          </Badge>
        )}
        {hasBlockingConflicts && (
          <span className="text-xs text-red-600 font-medium ml-auto">
            ⛔ Permit package blocked until critical conflicts resolved
          </span>
        )}
      </div>

      {[...conflicts]
        .sort((a, b) => {
          const order = { critical: 0, major: 1, minor: 2 };
          return order[a.severity] - order[b.severity];
        })
        .map(conflict => (
          <ConflictCard key={conflict.conflictId} conflict={conflict} />
        ))
      }
    </div>
  );
}
