import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, AlertCircle, FileDown } from "lucide-react";

interface PermitCompletenessPanelProps {
  projectId: number;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function PermitCompletenessPanel({ projectId, onGenerate, isGenerating }: PermitCompletenessPanelProps) {
  const { data: completeness, isLoading } = trpc.permitPackage.getCompleteness.useQuery(
    { projectId },
    { refetchOnWindowFocus: false }
  );

  if (isLoading || !completeness) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-2 w-full" />
        <div className="space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const sections = [
    { label: 'Project address',            done: completeness.project.hasAddress },
    { label: 'Zone code set',              done: completeness.project.hasZone },
    { label: 'Zone confirmed from city GIS', done: completeness.project.zoneConfirmed },
    { label: 'Site analysis',             done: completeness.siteAnalysis.exists,
      note: completeness.siteAnalysis.source === 'drawing_analyzer' ? '(from drawing)' : undefined },
    { label: 'Occupant load',             done: completeness.calculators.occupantLoad },
    { label: 'Exit requirements',         done: completeness.calculators.exitRequirements },
    { label: 'Travel distance',           done: completeness.calculators.travelDistance },
    { label: 'Stair design',              done: completeness.calculators.stairDesign },
    { label: 'Guard & handrail',          done: completeness.calculators.guardHandrail },
    { label: 'Accessibility ramp',        done: completeness.calculators.accessibilityRamp },
    { label: 'Fire separation',           done: completeness.calculators.fireSeparation },
    { label: 'Fire alarm',                done: completeness.calculators.fireAlarm },
    { label: 'Ventilation',              done: completeness.calculators.ventilationRate },
    { label: 'Barrier-free access',       done: completeness.calculators.barrierFree },
    { label: 'Plumbing fixtures',         done: completeness.calculators.plumbingFixture },
    { label: 'Snow load',                 done: completeness.calculators.snowLoad },
    { label: 'Thermal resistance (RSI)', done: completeness.calculators.thermalResistance },
    { label: 'NECB 2020 envelope compliance', done: completeness.calculators.necbEnvelope },
    { label: 'Spatial separation',       done: completeness.calculators.spatialSeparation },
    { label: 'Fire assembly drawings',    done: completeness.fireAssemblies.exists,
      note: completeness.fireAssemblies.exists ? '(from drawing analyzer)' : undefined },
  ];

  const complete = sections.filter(s => s.done).length;
  const total    = sections.length;
  const pct      = Math.round((complete / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{complete} of {total} sections complete</span>
        <span className="text-muted-foreground">{pct}%</span>
      </div>

      <Progress value={pct} className="h-2" />

      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {sections.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs py-0.5">
            {s.done
              ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
              : <AlertCircle  className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            }
            <span className={s.done ? 'text-foreground' : 'text-muted-foreground'}>
              {s.label}
              {s.note && <span className="ml-1 text-green-600">{s.note}</span>}
            </span>
          </div>
        ))}
      </div>

      {pct < 50 && (
        <p className="text-xs text-amber-600">
          ⚠ Less than half of sections complete — incomplete sections will show placeholders in the PDF.
        </p>
      )}

      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-slate-800 hover:bg-slate-900 text-white"
        size="sm"
      >
        <FileDown className="w-4 h-4 mr-1.5" />
        {isGenerating ? 'Generating…' : 'Generate Permit Package PDF'}
      </Button>
    </div>
  );
}
