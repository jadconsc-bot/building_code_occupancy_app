/**
 * CARLScorerPanel
 *
 * Displays the CARL permit completeness report — 78-item scored
 * checklist across 13 sections.
 *
 * Read-only — all values from deterministic carlScorer.ts.
 * Props flow downward only — no state mutation in this component.
 */

import { useState } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Info,
  ChevronDown, ChevronUp, ClipboardCheck, MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CARLReport, CARLItem, CARLSectionScore } from '@/lib/drawingDataExtractor';

interface CARLScorerPanelProps {
  carlReport: CARLReport;
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
  not_evaluated: {
    icon: Info,
    iconClass: 'text-slate-400',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    label: 'Not Evaluated',
  },
  out_of_scope: {
    icon: Info,
    iconClass: 'text-slate-300',
    badgeClass: 'bg-slate-50 text-slate-400 border-slate-100',
    label: 'Out of Scope',
  },
} as const;

const READINESS_DISPLAY = {
  'Ready': {
    badgeClass: 'bg-green-100 text-green-800 border-green-300',
    barClass: 'bg-green-500',
  },
  'Needs Work': {
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    barClass: 'bg-amber-500',
  },
  'Not Ready': {
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    barClass: 'bg-red-500',
  },
} as const;

function CARLItemRow({ item }: { item: CARLItem }) {
  const display = STATUS_DISPLAY[item.status];
  const Icon = display.icon;
  const isOutOfScope = item.status === 'out_of_scope';

  return (
    <div className={`flex items-start gap-2 py-1.5 border-b border-border last:border-0 ${isOutOfScope ? 'opacity-40' : ''}`}>
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${display.iconClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium leading-snug">{item.description}</span>
          <div className="flex items-center gap-1 shrink-0">
            {item.jurisdiction && (
              <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                {item.jurisdiction}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs px-1 py-0 ${display.badgeClass}`}>
              {display.label}
            </Badge>
          </div>
        </div>
        {item.evidence && (
          <p className="text-xs text-muted-foreground mt-0.5">{item.evidence}</p>
        )}
        {item.recommendation && item.status !== 'pass' && item.status !== 'out_of_scope' && (
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {item.recommendation}
          </p>
        )}
        <p className="text-xs text-muted-foreground/60 mt-0.5">{item.nbcRef} · {item.carlId}</p>
      </div>
    </div>
  );
}

function CARLSection({
  score,
  items,
  defaultOpen,
}: {
  score: CARLSectionScore;
  items: CARLItem[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasFailure = score.hasBlockingFailure;

  return (
    <div className={`border rounded-md overflow-hidden ${hasFailure ? 'border-red-200' : 'border-border'}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          {hasFailure && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
          <span className="text-xs font-semibold">
            {score.section}. {score.sectionName}
          </span>
          <span className="text-xs text-muted-foreground">
            ({score.itemCount} items)
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                score.score >= 80 ? 'bg-green-500'
                : score.score >= 50 ? 'bg-amber-500'
                : 'bg-red-500'
              }`}
              style={{ width: `${score.score}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-7 text-right">{score.score}%</span>
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="px-3 py-1">
          {items.map(item => (
            <CARLItemRow key={item.carlId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CARLScorerPanel({ carlReport }: CARLScorerPanelProps) {
  const readiness = READINESS_DISPLAY[carlReport.permitReadinessLabel];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold">Permit Readiness</span>
          <Badge variant="outline" className={`text-xs font-semibold ${readiness.badgeClass}`}>
            {carlReport.permitReadinessLabel}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-green-600 font-medium">✓ {carlReport.passCount} Pass</span>
          <span className="text-red-600 font-medium">✗ {carlReport.failCount} Fail</span>
          <span className="text-amber-600 font-medium">⚠ {carlReport.advisoryCount} Advisory</span>
          <span className="text-slate-400">{carlReport.outOfScopeCount} Out of scope</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Completeness score</span>
          <span className="font-medium">{carlReport.permitReadinessScore}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${readiness.barClass}`}
            style={{ width: `${carlReport.permitReadinessScore}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground/60">
          <span>0 — Not Ready</span>
          <span>50 — Needs Work</span>
          <span>80+ — Ready</span>
        </div>
      </div>

      {carlReport.blockingItems.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="py-2 px-3 bg-red-50 dark:bg-red-950">
            <CardTitle className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5" />
              {carlReport.blockingItems.length} Blocking Item{carlReport.blockingItems.length > 1 ? 's' : ''} — Must resolve before permit submission
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 py-1">
            {carlReport.blockingItems.map(item => (
              <CARLItemRow key={item.carlId} item={item} />
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-1.5">
        {carlReport.sectionScores.map(sectionScore => {
          const sectionItems = carlReport.items.filter(
            i => i.section === sectionScore.section
          );
          if (sectionItems.length === 0) return null;
          return (
            <CARLSection
              key={sectionScore.section}
              score={sectionScore}
              items={sectionItems}
              defaultOpen={sectionScore.hasBlockingFailure || sectionScore.score < 50}
            />
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center pt-2 border-t border-border">
        CARL — Code Applicable Review List · {carlReport.codeEdition}
        {carlReport.jurisdictionSource === 'geocoded' && (
          <span className="inline-flex items-center gap-1 ml-2">
            <MapPin className="w-3 h-3" /> Jurisdiction auto-detected
          </span>
        )}
      </p>
    </div>
  );
}
