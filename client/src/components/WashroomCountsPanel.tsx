/**
 * WashroomCountsPanel
 *
 * Displays minimum plumbing fixture requirements per occupancy group.
 * Read-only — all values calculated deterministically by washroomCalculator.ts
 * (NBC 3.7.2.1). No compliance decisions made in this component.
 *
 * Props flow downward only — immutability principle enforced.
 * Results are from the compliance engine run, never from user input.
 */

import { CheckCircle2, AlertCircle, Info, MapPin, Droplets } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WashroomResult } from '@/lib/drawingDataExtractor';

interface WashroomCountsPanelProps {
  washroomCounts: WashroomResult[];
  // Timestamp of the orchestrator run that produced these results.
  // Used to show users when the calculation was last performed.
  evaluatedAt?: string;
}

// Map confidence level to badge variant and label
const CONFIDENCE_DISPLAY = {
  confirmed:  { label: 'Confirmed',  className: 'bg-green-50 text-green-800 border-green-200' },
  inferred:   { label: 'Inferred',   className: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  advisory:   { label: 'Advisory',   className: 'bg-blue-50 text-blue-800 border-blue-200' },
} as const;

// Map jurisdictionSource to display label
const SOURCE_DISPLAY: Record<string, string> = {
  geocoded: 'Auto-detected from address',
  manual:   'Manually set',
  device:   'Device location',
  fallback: 'Fallback',
};

export function WashroomCountsPanel({
  washroomCounts,
  evaluatedAt,
}: WashroomCountsPanelProps) {
  // Nothing to show if orchestrator hasn't run or no groups found
  if (!washroomCounts || washroomCounts.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Droplets className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-foreground">
          Washroom Requirements
        </h3>
        <span className="text-xs text-muted-foreground">
          NBC 3.7.2.1
        </span>
        {evaluatedAt && (
          <span className="text-xs text-muted-foreground ml-auto">
            Calculated {new Date(evaluatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* One card per occupancy group */}
      {washroomCounts.map((result, idx) => {
        const confidence = CONFIDENCE_DISPLAY[result.confidence] ?? CONFIDENCE_DISPLAY.advisory;

        return (
          <Card key={`${result.occupancyGroup}-${idx}`} className="rounded-none border-l-4 border-l-blue-400">
            <CardHeader className="py-2 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Group {result.occupancyGroup}
                  <span className="font-normal text-muted-foreground ml-2">
                    · {result.occupantLoad} persons
                  </span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${confidence.className}`}
                  >
                    {confidence.label}
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
              {/* Fixture requirements table */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div className="text-muted-foreground">Water Closets (Male)</div>
                <div className="font-medium">{result.required.waterClosetsMale}</div>

                <div className="text-muted-foreground">Water Closets (Female)</div>
                <div className="font-medium">{result.required.waterClosetsFemale}</div>

                <div className="text-muted-foreground">Lavatories</div>
                <div className="font-medium">{result.required.lavatories}</div>

                <div className="text-muted-foreground">Drinking Fountains</div>
                <div className="font-medium">{result.required.drinkingFountains}</div>

                <div className="text-muted-foreground">Accessible Stall</div>
                <div className="font-medium flex items-center gap-1">
                  {result.required.accessibleStallsRequired ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      Required
                      <span className="text-xs text-muted-foreground">(NBC 3.8.3.8)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      Not required
                    </>
                  )}
                </div>
              </div>

              {/* Citation + assumptions */}
              <div className="mt-3 pt-3 border-t border-border space-y-1">
                <p className="text-xs text-muted-foreground">
                  📎 {result.nbcRef} · {result.codeEdition}
                </p>
                {result.assumptions.map((a, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    {a}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
