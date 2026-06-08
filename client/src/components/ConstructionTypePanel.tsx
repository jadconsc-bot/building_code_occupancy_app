/**
 * ConstructionTypePanel
 *
 * Displays construction type determination per occupancy group.
 * Read-only — all values calculated deterministically by
 * constructionTypeEngine.ts (NBC Table 3.2.2.20).
 *
 * Props flow downward only — immutability principle enforced.
 * Results are from the compliance engine run, never from user input.
 */

import { CheckCircle2, XCircle, AlertTriangle, Info, MapPin, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ConstructionTypeResult } from '@/lib/drawingDataExtractor';

interface ConstructionTypePanelProps {
  constructionTypes: ConstructionTypeResult[];
}

const SEVERITY_DISPLAY = {
  pass: {
    icon: CheckCircle2,
    iconClass: 'text-green-500',
    badgeClass: 'bg-green-50 text-green-800 border-green-200',
    borderClass: 'border-l-green-400',
    label: 'Combustible Permitted',
  },
  fail: {
    icon: XCircle,
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
    borderClass: 'border-l-red-400',
    label: 'Non-Combustible Required',
  },
  conditional: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    borderClass: 'border-l-amber-400',
    label: 'Conditional',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    borderClass: 'border-l-blue-400',
    label: 'Advisory',
  },
} as const;

const SOURCE_DISPLAY: Record<string, string> = {
  geocoded: 'Auto-detected from address',
  manual:   'Manually set',
  device:   'Device location',
  fallback: 'Fallback',
};

export function ConstructionTypePanel({ constructionTypes }: ConstructionTypePanelProps) {
  if (!constructionTypes || constructionTypes.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Construction Type
        </h3>
        <span className="text-xs text-muted-foreground">
          NBC Table 3.2.2.20
        </span>
      </div>

      {constructionTypes.map((result, idx) => {
        const display = SEVERITY_DISPLAY[result.severity] ?? SEVERITY_DISPLAY.info;
        const Icon = display.icon;

        return (
          <Card
            key={`${result.occupancyGroup}-${idx}`}
            className={`rounded-none border-l-4 ${display.borderClass}`}
          >
            <CardHeader className="py-2 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${display.iconClass}`} />
                  Group {result.occupancyGroup}
                  <span className="font-normal text-muted-foreground">
                    · {result.constructionType}
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${display.badgeClass}`}>
                    {display.label}
                  </Badge>
                  {result.jurisdictionSource && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {SOURCE_DISPLAY[result.jurisdictionSource] ?? result.jurisdictionSource}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="py-2 px-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div className="text-muted-foreground">Actual Storeys</div>
                <div className="font-medium">{result.actualStoreys}</div>

                <div className="text-muted-foreground">Storey Limit (Combustible)</div>
                <div className={`font-medium ${result.storeyMargin < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {result.limitingStoreys === 0 ? '—' : result.limitingStoreys}
                  {result.limitingStoreys > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({result.storeyMargin >= 0
                        ? `${result.storeyMargin} remaining`
                        : `${Math.abs(result.storeyMargin)} exceeded`})
                    </span>
                  )}
                </div>

                <div className="text-muted-foreground">Actual Area</div>
                <div className="font-medium">{Math.round(result.actualAreaM2)} m²</div>

                <div className="text-muted-foreground">Area Limit (Combustible)</div>
                <div className={`font-medium ${result.areaMarginM2 < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {result.limitingAreaM2 === 0 ? '—' : `${Math.round(result.limitingAreaM2)} m²`}
                  {result.limitingAreaM2 > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({result.areaMarginPercent >= 0
                        ? `${result.areaMarginPercent}% remaining`
                        : `${Math.abs(result.areaMarginPercent)}% exceeded`})
                    </span>
                  )}
                </div>
              </div>

              {result.reasoning && (
                <p className="mt-2 text-xs text-muted-foreground">{result.reasoning}</p>
              )}

              {result.recommendations.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              )}

              {result.assumptions.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {result.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-muted-foreground italic flex items-start gap-1">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                📎 {result.nbcRef} · {result.codeEdition}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
