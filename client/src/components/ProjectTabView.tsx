import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface ProjectTabViewProps {
  readonly projectId: string;
  readonly onNavigate?: (route: string, params?: Record<string, any>) => void;
  readonly onBack?: () => void;
}

export function ProjectTabView({ projectId, onNavigate, onBack }: ProjectTabViewProps) {
  const [, setLocation] = useLocation();
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

  const calculationsQuery = trpc.calculations.getProjectCalculations.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // ── Derived state ──────────────────────────────────────────
  const project = projectQuery.data;
  const snapshots = snapshotsQuery.data ?? [];
  const calculations = calculationsQuery.data ?? [];

  const isLoading =
    projectQuery.isLoading ||
    snapshotsQuery.isLoading ||
    calculationsQuery.isLoading;

  const isError =
    projectQuery.isError ||
    snapshotsQuery.isError ||
    calculationsQuery.isError;

  // Most recent snapshot drives the status badge
  const latestSnapshot = snapshots.length > 0
    ? snapshots.sort((a, b) =>
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

  // Extract metrics from latest snapshot outputs
  const snapshotOutputs = latestSnapshot
    ? (() => {
        try {
          return typeof latestSnapshot.outputs === "string"
            ? JSON.parse(latestSnapshot.outputs)
            : latestSnapshot.outputs;
        } catch {
          return {};
        }
      })()
    : {};

  // Occupancy load — from occupantLoad calculator result
  const occupantCalc = calculations
    .filter((c) => c.calculatorType === "occupantLoad")
    .sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  const occupantResults = occupantCalc
    ? (() => {
        try {
          return typeof occupantCalc.outputs === "string"
            ? JSON.parse(occupantCalc.outputs)
            : occupantCalc.outputs;
        } catch {
          return {};
        }
      })()
    : {};

  const occupancyCurrent: number = occupantResults.adjustedOccupantLoad ?? 0;
  const occupancyMax: number = occupantResults.baseOccupantLoad ?? 0;

  // Travel distance — from snapshot outputs
  const travelDistanceActual: number =
    snapshotOutputs.travel_distance_m ?? 0;
  const travelDistanceMax = 40; // NBC maximum

  // Egress — from snapshot outputs
  const egressProvided: number = snapshotOutputs.exits ?? 0;
  const egressRequired: number =
    typeof snapshotOutputs.exits_required === "number"
      ? snapshotOutputs.exits_required
      : 0;

  // Indicator colors
  const occupancyColor =
    occupancyCurrent === 0
      ? "text-muted-foreground"
      : occupancyCurrent <= occupancyMax
      ? "text-green-600"
      : "text-red-600";

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
  const hasCalculations = calculations.length > 0;
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
  if (isError || !project) {
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
                ? `${occupancyCurrent} persons (max ${occupancyMax})`
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

    </div>
  );
}
