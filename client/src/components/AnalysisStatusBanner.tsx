/**
 * AnalysisStatusBanner Component
 *
 * PD2.0 §5.1 — Analysis Status Workflow
 * Displays the current status of a drawing analysis with appropriate visual treatment.
 *
 * Status flow: DRAFT → UNDER_REVIEW → VALID | REJECTED
 *
 * DRAFT:        Analysis created, not yet reviewed by a professional
 * UNDER_REVIEW: Submitted for professional review
 * VALID:        Approved by a licensed professional
 * REJECTED:     Rejected by a licensed professional — requires revision
 */

import { AlertTriangle, CheckCircle2, Clock, FileX, Info } from "lucide-react";

type AnalysisStatus = "DRAFT" | "UNDER_REVIEW" | "VALID" | "REJECTED";

interface AnalysisStatusBannerProps {
  status: AnalysisStatus;
  validatedByName?: string | null;
  validatedAt?: Date | string | null;
  className?: string;
}

const STATUS_CONFIG: Record<AnalysisStatus, {
  icon: React.ReactNode;
  label: string;
  description: string;
  classes: string;
}> = {
  DRAFT: {
    icon: <Clock className="w-4 h-4 shrink-0 mt-0.5" />,
    label: "DRAFT — Awaiting Professional Review",
    description:
      "This analysis is AI-generated and has not been reviewed by a licensed professional. " +
      "Results are for informational purposes only and MUST NOT be used for regulatory submissions.",
    classes:
      "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  },
  UNDER_REVIEW: {
    icon: <Info className="w-4 h-4 shrink-0 mt-0.5" />,
    label: "UNDER REVIEW — Pending Professional Sign-Off",
    description:
      "This analysis has been submitted for professional review. " +
      "Do not use for regulatory purposes until a licensed professional has approved it.",
    classes:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
  },
  VALID: {
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />,
    label: "VALID — Reviewed by Licensed Professional",
    description: "",
    classes:
      "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  },
  REJECTED: {
    icon: <FileX className="w-4 h-4 shrink-0 mt-0.5" />,
    label: "REJECTED — Revision Required",
    description:
      "This analysis has been rejected by a licensed professional. " +
      "The drawing requires revision before it can be approved.",
    classes:
      "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
  },
};

export function AnalysisStatusBanner({
  status,
  validatedByName,
  validatedAt,
  className = "",
}: AnalysisStatusBannerProps) {
  const config = STATUS_CONFIG[status];

  const formattedDate = validatedAt
    ? new Date(validatedAt).toLocaleString()
    : null;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${config.classes} ${className}`}>
      {config.icon}
      <div className="space-y-0.5">
        <p className="font-semibold">{config.label}</p>
        {config.description && (
          <p className="opacity-80 text-xs leading-relaxed">{config.description}</p>
        )}
        {status === "VALID" && validatedByName && (
          <p className="text-xs opacity-80">
            Reviewed by: <span className="font-medium">{validatedByName}</span>
            {formattedDate && <> on {formattedDate}</>}
          </p>
        )}
        {status === "REJECTED" && validatedByName && (
          <p className="text-xs opacity-80">
            Rejected by: <span className="font-medium">{validatedByName}</span>
            {formattedDate && <> on {formattedDate}</>}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Compact inline status badge — use in tables and list views
 */
export function AnalysisStatusBadge({ status }: { status: AnalysisStatus }) {
  const badges: Record<AnalysisStatus, { label: string; classes: string }> = {
    DRAFT: { label: "Draft", classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
    UNDER_REVIEW: { label: "Under Review", classes: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
    VALID: { label: "Valid", classes: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
    REJECTED: { label: "Rejected", classes: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
  };
  const b = badges[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${b.classes}`}>
      {b.label}
    </span>
  );
}

/**
 * Mandatory disclaimer footer — always shown below analysis results per PD2.0 §6.2
 */
export function AnalysisDisclaimerFooter() {
  return (
    <div className="flex items-start gap-2 p-3 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
      <p>
        <strong>Professional Review Required:</strong> This AI-generated analysis is for informational
        purposes only. All results must be reviewed and verified by a licensed professional engineer
        or registered architect before use in any regulatory submission, permit application, or
        construction document. CodeComply and its operators accept no liability for decisions made
        based solely on this analysis.
      </p>
    </div>
  );
}
