/**
 * BarrierFreePanel
 *
 * Displays barrier-free requirements per NBC Part 3.8.
 * Read-only — all values from deterministic barrierFreeCalculator.ts.
 * Props flow downward only — no state mutation in this component.
 */

import { CheckCircle2, XCircle, AlertTriangle, Info, Accessibility } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BarrierFreeResult, BarrierFreeRequirement } from '@/lib/drawingDataExtractor';

interface BarrierFreePanelProps {
  barrierFreeRequirements: BarrierFreeResult;
}

const STATUS_DISPLAY = {
  pass: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-50 text-green-800 border-green-200',
    label: 'Pass',
  },
  fail: {
    icon: XCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    label: 'Fail',
  },
  advisory: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    label: 'Advisory',
  },
  not_applicable: {
    icon: Info,
    iconClass: 'text-slate-300',
    badgeClass: 'bg-slate-50 text-slate-400 border-slate-100',
    label: 'N/A',
  },
} as const;

function RequirementRow({ req }: { req: BarrierFreeRequirement }) {
  const display = STATUS_DISPLAY[req.status];
  const Icon = display.icon;

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border last:border-0">
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${display.iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium leading-snug">{req.description}</span>
          <Badge variant="outline" className={`text-xs px-1 py-0 shrink-0 ${display.badgeClass}`}>
            {display.label}
          </Badge>
        </div>
        {req.value && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Required: {req.value}
          </p>
        )}
        {req.recommendation && req.status !== 'pass' && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {req.recommendation}
          </p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          {req.nbcRef} · {req.requirementId}
        </p>
      </div>
    </div>
  );
}

export function BarrierFreePanel({ barrierFreeRequirements: bf }: BarrierFreePanelProps) {
  if (!bf) return null;

  if (!bf.isBarrierFreeRequired) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Accessibility className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-foreground">
            Barrier-Free Requirements
          </h3>
          <span className="text-xs text-muted-foreground">NBC Part 3.8</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-green-50 dark:bg-green-950 border border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          <p className="text-xs text-green-800 dark:text-green-300">
            Building exempt from NBC Part 3.8 — single detached/semi-detached/duplex ≤2 storeys
          </p>
        </div>
        {bf.assumptions.map((a, i) => (
          <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {a}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Accessibility className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Barrier-Free Requirements
        </h3>
        <span className="text-xs text-muted-foreground">NBC Part 3.8</span>
        <div className="flex items-center gap-1 ml-auto">
          {bf.passCount > 0 && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-800 border-green-200">
              {bf.passCount} Pass
            </Badge>
          )}
          {bf.advisoryCount > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-200">
              {bf.advisoryCount} Advisory
            </Badge>
          )}
          {bf.failCount > 0 && (
            <Badge variant="outline" className="text-xs bg-red-50 text-red-800 border-red-200">
              {bf.failCount} Fail
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
          {bf.elevatorRequired
            ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          }
          <span className="font-medium">
            Elevator {bf.elevatorRequired ? 'Required' : 'Not Required'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50">
          {bf.accessibleWashroomRequired
            ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
          }
          <span className="font-medium">
            Accessible WC {bf.accessibleWashroomRequired ? 'Required' : 'Not Required'}
          </span>
        </div>
        {bf.accessibleUnitsRequired !== null && (
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-muted/50 col-span-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-medium">
              {bf.accessibleUnitsRequired} Accessible Unit(s) Required
              ({Math.round((bf.accessibleUnitsMinPercent ?? 0.15) * 100)}% of total)
            </span>
          </div>
        )}
      </div>

      <Card className="rounded-none">
        <CardHeader className="py-2 px-4">
          <CardTitle className="text-xs font-semibold text-muted-foreground">
            {bf.requirementCount} Requirements — {bf.codeEdition}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-1">
          {bf.requirements.map(req => (
            <RequirementRow key={req.requirementId} req={req} />
          ))}
        </CardContent>
      </Card>

      {bf.assumptions.length > 0 && (
        <div className="space-y-0.5">
          {bf.assumptions.map((a, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              {a}
            </p>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground/60 pt-1 border-t border-border">
        📎 {bf.nbcRef} · {bf.codeEdition}
        {bf.confidence === 'advisory' && (
          <span className="ml-2 text-amber-600">
            Advisory — spatial verification required on drawings
          </span>
        )}
      </p>
    </div>
  );
}
