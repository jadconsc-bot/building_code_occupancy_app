import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import { Badge } from "@/components/ui/badge";

interface ProjectTabViewProps {
  readonly projectId: string;
  readonly onNavigate?: (route: string, params?: Record<string, any>) => void;
  readonly onBack?: () => void;
}

export function ProjectTabView({ projectId, onNavigate, onBack }: ProjectTabViewProps) {
  const [, setLocation] = useLocation();
  const { setActiveProjectId } = useProject();

  if (!projectId) return <div>Loading...</div>;

  const numericProjectId = Number(projectId);

  // ── Data fetching ──────────────────────────────────────────
  const projectQuery = trpc.projects.get.useQuery(
    { id: numericProjectId },
    { enabled: !!projectId }
  );

  const snapshotsQuery = trpc.compliance.getProjectSnapshots.useQuery(
    { projectId: numericProjectId },
    { enabled: !!projectId }
  );

  // ── Derived state ──────────────────────────────────────────
  const project = projectQuery.data;
  const snapshots = snapshotsQuery.data ?? [];

  const isLoading =
    projectQuery.isLoading ||
    snapshotsQuery.isLoading;

  const isError =
    projectQuery.isError ||
    snapshotsQuery.isError;

  // Most recent snapshot drives the status badge
  const latestSnapshot = snapshots.length > 0
    ? snapshots.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    : null;

  // Compliance status badge
  const complianceStatus: "PASS" | "FAIL" | "IN_REVIEW" | "UNKNOWN" =
    !latestSnapshot
      ? "UNKNOWN"
      : latestSnapshot.complianceStatus === "compliant"
      ? "PASS"
      : latestSnapshot.complianceStatus === "non_compliant"
      ? "FAIL"
      : "IN_REVIEW";

  // Extract metrics from snapshot inputs (where user-supplied values live)
  const snapshotInputs: Record<string, any> = latestSnapshot?.inputs ?? {};

  // Occupant Load — estimated from area + occupancy type (NBC Table 4.1.5.3)
  const nbcLoadFactors: Record<string, number> = {
    A: 1.0, B: 4.6, C: 25.0, D: 9.3, E: 3.7, "F-1": 30, "F-2": 30, "F-3": 30,
  };
  const occupancyMajor: string = String(snapshotInputs.occupancy_major ?? "");
  const areaM2: number = Number(snapshotInputs.area_m2) || 0;
  const loadFactor = nbcLoadFactors[occupancyMajor] ?? 9.3;
  const occupancyCurrent: number = areaM2 > 0 ? Math.ceil(areaM2 / loadFactor) : 0;
  const occupancyIsEstimate = occupancyCurrent > 0;

  // Travel distance — from snapshot inputs (user-entered value)
  const travelDistanceActual: number = Number(snapshotInputs.travel_distance_m) || 0;
  const travelDistanceMax = 40; // NBC maximum

  // Egress — provided from inputs; required derived from NBC Table 3.4.2.3
  const egressProvided: number = Number(snapshotInputs.exits) || 0;
  const egressRequired: number =
    occupancyCurrent <= 0 ? 0
    : occupancyCurrent > 600 ? 3
    : occupancyCurrent > 60 ? 2
    : 1;

  // Indicator colors
  const occupancyColor =
    occupancyCurrent === 0 ? "text-muted-foreground" : "text-foreground";

  const travelColor =
    travelDistanceActual === 0
      ? "text-muted-foreground"
      : travelDistanceActual <= travelDistanceMax
      ? "text-green-600"
      : "text-red-600";

  const egressColor =
    egressProvided === 0
      ? "text-muted-foreground"
      : egressProvided >= egressRequired
      ? "text-green-600"
      : "text-red-600";

  // Action button logic
  const hasCalculations = snapshots.length > 0;
  const hasFindings = complianceStatus === "FAIL" || complianceStatus === "IN_REVIEW";

  const actionLabel = !hasCalculations
    ? "Upload Plan"
    : hasFindings
    ? "Review Findings"
    : "View Report";

  const handleAction = () => {
    if (!hasCalculations || hasFindings) {
      setLocation(`/compliance/${projectId}`);
    } else {
      setLocation(`/compliance/${projectId}`);
    }
  };

  // Badge config
  const badgeConfig = {
    PASS: { label: "PASS", className: "bg-green-100 text-green-800 border-green-300" },
    FAIL: { label: "FAIL", className: "bg-red-100 text-red-800 border-red-300" },
    IN_REVIEW: { label: "IN REVIEW", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    UNKNOWN: { label: "NO DATA", className: "bg-gray-100 text-gray-600 border-gray-300" },
  };

  const badge = badgeConfig[complianceStatus];

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Failed to load project. Please try again.</p>
        <button
          onClick={onBack}
          className="mt-2 text-sm underline"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!project) return null;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">

      {/* Back button */}
      <button
        onClick={onBack}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        ← Back to Projects
      </button>

      {/* STATUS BAR */}
      <div className="rounded-lg border bg-card p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold leading-tight">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {project.address ?? "No address on file"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.occupancyCode} · {project.template ?? "NBC 2023"}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded border ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Project Credentials */}
        <div className="flex flex-wrap gap-2 mt-3">
          {project.codeEdition && (
            <Badge variant="outline" className="text-xs">
              📋 {project.codeEdition}
            </Badge>
          )}
          {project.part3Determination && (
            <Badge variant="outline" className="text-xs">
              🏗️ {project.part3Determination}
            </Badge>
          )}
          {project.constructionType && (
            <Badge variant="outline" className="text-xs">
              🧱 {project.constructionType === 'combustible' ? 'Combustible' :
                  project.constructionType === 'non_combustible' ? 'Non-Combustible' :
                  project.constructionType}
            </Badge>
          )}
          {project.sprinklersRequired === 1 && (
            <Badge variant="outline" className="text-xs text-red-600 border-red-300">
              🚿 Sprinklers Required
            </Badge>
          )}
          {project.sprinklersRequired === 0 && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
              ✓ Sprinklers Not Required
            </Badge>
          )}
          {project.zoningCategory && (
            <Badge variant="outline" className="text-xs">
              🏘️ {project.zoningCategory}
            </Badge>
          )}
          {project.storeys && (
            <Badge variant="outline" className="text-xs">
              📐 {project.storeys} {project.storeys === 1 ? 'Storey' : 'Storeys'}
            </Badge>
          )}
          {project.buildingHeight && (
            <Badge variant="outline" className="text-xs">
              📏 {parseFloat(project.buildingHeight as string).toFixed(1)}m height
            </Badge>
          )}
        </div>
      </div>

      {/* FINDINGS SUMMARY */}
      <div className="rounded-lg border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">Key Metrics</h3>
        <div className="space-y-2">

          {/* Occupancy */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Occupant Load</span>
            <span className={`font-medium ${occupancyColor}`}>
              {occupancyCurrent > 0
                ? `${occupancyCurrent} persons${occupancyIsEstimate ? " (est.)" : ""}`
                : "—"}
            </span>
          </div>

          {/* Travel Distance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Travel Distance</span>
            <span className={`font-medium ${travelColor}`}>
              {travelDistanceActual > 0
                ? `${travelDistanceActual}m (max ${travelDistanceMax}m)`
                : "—"}
            </span>
          </div>

          {/* Egress */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Egress Doors</span>
            <span className={`font-medium ${egressColor}`}>
              {egressRequired > 0
                ? `${egressProvided} provided, ${egressRequired} required`
                : "—"}
            </span>
          </div>

        </div>
      </div>

      {/* ACTION BUTTON */}
      <button
        onClick={handleAction}
        className="w-full rounded-lg bg-primary text-primary-foreground py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        {actionLabel}
      </button>

      <button
        onClick={() => {
          setActiveProjectId(numericProjectId);
          setLocation('/project-checklists');
        }}
        className="w-full rounded-lg border border-border py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
      >
        View Checklist
      </button>

    </div>
  );
}
