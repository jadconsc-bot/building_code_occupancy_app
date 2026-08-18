/**
 * ProfessionalReviewPanel Component
 *
 * Implements the professional review workflow for drawing analyses.
 * Follows Prime Directive 2.0 protocols:
 * - §4.3: Status workflow UNDER_REVIEW → VALID | REJECTED
 * - §7.2: PROFESSIONAL_ACCEPTED + PROFESSIONAL_REJECTED audit events
 * - §8.2: Professional credentials captured and stored immutably
 *
 * Workflow: Review → Verify Credentials → Approve/Reject → Confirmation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  User,
  Award,
  MapPin,
  Loader2,
  AlertTriangle,
  HelpCircle,
  Minus,
  Info,
} from "lucide-react";
import { ExportAnalysisPDFButton } from "@/components/ExportAnalysisPDFButton";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RuleEvaluation {
  ruleId: string;
  clause: string;
  description: string;
  result: "PASS" | "FAIL" | "CONDITIONAL" | "UNABLE_TO_EVALUATE";
  category: string;
  severity: "critical" | "major" | "minor" | "info";
  details: string;
  roomId?: number | null;
  roomLabel?: string | null;
}

interface ComplianceIssue {
  severity: string;
  category: string;
  description: string;
  clause: string;
  recommendation: string;
}

interface ProfessionalReviewPanelProps {
  analysisId: number;
  analysisStatus: "DRAFT" | "UNDER_REVIEW" | "VALID" | "REJECTED";
  complianceScore: number | null;
  complianceLevel: string | null;
  ruleEvaluations: RuleEvaluation[];
  issues: ComplianceIssue[];
  recommendations: string[];
  onStatusChange: (newStatus: "VALID" | "REJECTED") => void;
}

function statusLabel(status: string): { text: string; color: string; icon: string } {
  switch (status) {
    case "PASS": case "pass": case "compliant":
      return { text: "Compliant", color: "text-green-700", icon: "CheckCircle" };
    case "FAIL": case "fail": case "non_compliant":
      return { text: "Non-compliant", color: "text-red-700", icon: "XCircle" };
    case "CONDITIONAL": case "warning": case "advisory":
      return { text: "Verify required", color: "text-amber-700", icon: "AlertTriangle" };
    case "UNABLE_TO_EVALUATE": case "not_evaluated":
      return { text: "Not assessable from drawing", color: "text-gray-500", icon: "HelpCircle" };
    case "not_applicable":
      return { text: "Not applicable", color: "text-gray-400", icon: "Minus" };
    default:
      return { text: status, color: "text-gray-600", icon: "Info" };
  }
}

const statusIcons = { CheckCircle, XCircle, AlertTriangle, HelpCircle, Minus, Info };

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfessionalReviewPanel({
  analysisId,
  analysisStatus,
  complianceScore,
  complianceLevel,
  ruleEvaluations,
  issues,
  recommendations,
  onStatusChange,
}: ProfessionalReviewPanelProps) {
  // Form state
  const [licenseNumber, setLicenseNumber] = useState("");
  const [professionalAssociation, setProfessionalAssociation] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Alberta");
  const [validationNotes, setValidationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);

  // UI state
  const [step, setStep] = useState<"review" | "credentials" | "confirm" | "complete">("review");
  const [error, setError] = useState<string | null>(null);

  // tRPC mutations
  const validateMutation = trpc.drawingAnalysis.validateAnalysis.useMutation({
    onSuccess: () => {
      setStep("complete");
      onStatusChange("VALID");
    },
    onError: (err) => {
      setError(err.message || "Failed to submit approval");
    },
  });

  const rejectMutation = trpc.drawingAnalysis.rejectAnalysis.useMutation({
    onSuccess: () => {
      setStep("complete");
      onStatusChange("REJECTED");
    },
    onError: (err) => {
      setError(err.message || "Failed to submit rejection");
    },
  });

  const isPending = validateMutation.isPending || rejectMutation.isPending;

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const passCount = ruleEvaluations.filter((r) => statusLabel(r.result).text === "Compliant").length;
  const failCount = ruleEvaluations.filter((r) => statusLabel(r.result).text === "Non-compliant").length;
  const conditionalCount = ruleEvaluations.filter((r) => statusLabel(r.result).text === "Verify required").length;
  const criticalIssues = issues.filter((i) => i.severity === "critical");

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleSubmit = () => {
    if (decision === "approve") {
      validateMutation.mutate({
        analysisId,
        licenseNumber,
        professionalAssociation,
        jurisdiction,
        validationNotes: validationNotes || undefined,
      });
    } else if (decision === "reject") {
      rejectMutation.mutate({
        analysisId,
        rejectionReason,
      });
    }
  };

  // ─── Already validated/rejected ─────────────────────────────────────────────

  if (analysisStatus === "VALID") {
    return (
      <div className="space-y-3">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Analysis Validated — Status: VALID</p>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                This analysis has been professionally reviewed and validated. The approval and
                professional credentials are immutably recorded in the audit trail.
              </p>
            </div>
          </div>
        </div>
        {/* PD2.0 §9.1: Export button only available for VALID analyses */}
        <ExportAnalysisPDFButton
          analysisId={analysisId}
          variant="default"
          size="sm"
        />
      </div>
    );
  }

  if (analysisStatus === "REJECTED") {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex gap-3 items-start">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">Analysis Rejected</p>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              This analysis has been rejected by a professional reviewer. The rejection is
              immutably recorded in the audit trail.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (analysisStatus !== "UNDER_REVIEW") {
    return null;
  }

  // ─── Step: Complete ──────────────────────────────────────────────────────────

  if (step === "complete") {
    return (
      <div className="space-y-4">
        {decision === "approve" ? (
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  ✅ Analysis Approved — Status: VALID
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Your approval and professional credentials have been recorded immutably in the
                  audit trail (PROFESSIONAL_ACCEPTED event).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  Analysis Rejected — Status: REJECTED
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  Your rejection has been recorded in the audit trail (PROFESSIONAL_REJECTED event).
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
          <p className="font-semibold text-muted-foreground uppercase tracking-wider">
            Audit Summary
          </p>
          <p>
            <span className="font-medium">Decision:</span>{" "}
            {decision === "approve" ? "Approved (VALID)" : "Rejected"}
          </p>
          <p>
            <span className="font-medium">License:</span> {licenseNumber}
          </p>
          <p>
            <span className="font-medium">Association:</span> {professionalAssociation}
          </p>
          <p>
            <span className="font-medium">Jurisdiction:</span> {jurisdiction}
          </p>
          <p className="text-muted-foreground">
            All events recorded with server-side UTC timestamps and real IP address.
          </p>
        </div>
      </div>
    );
  }

  // ─── Step: Review ────────────────────────────────────────────────────────────

  const renderReviewStep = () => (
    <div className="space-y-4">
      {/* PD2.0 Notice */}
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <div className="flex gap-2 items-start">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-semibold">PD2.0 Professional Review:</span> You are reviewing
            AI-extracted data evaluated by a deterministic rule engine. Your professional judgment
            determines the final compliance status. This action is immutably recorded.
          </p>
        </div>
      </div>

      {/* Compliance Score */}
      {complianceScore !== null && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Compliance Score</p>
            <p className={`text-2xl font-bold ${getScoreColor(complianceScore)}`}>
              {complianceScore}%
            </p>
            {complianceLevel && (
              <Badge variant="outline" className="text-xs mt-1">
                {complianceLevel}
              </Badge>
            )}
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Rules Evaluated</p>
            <p className="text-2xl font-bold">{ruleEvaluations.length}</p>
            <p className="text-xs text-green-600">{passCount} pass</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Issues Found</p>
            <p className={`text-2xl font-bold ${failCount > 0 ? "text-red-600" : "text-green-600"}`}>
              {failCount}
            </p>
            {criticalIssues.length > 0 && (
              <p className="text-xs text-red-600">{criticalIssues.length} critical</p>
            )}
          </div>
        </div>
      )}

      {/* Rule Evaluations Summary */}
      {ruleEvaluations.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Rule Evaluations</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {ruleEvaluations.map((rule, idx) => {
              const status = statusLabel(rule.result);
              const StatusIcon = statusIcons[status.icon as keyof typeof statusIcons];
              return (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded bg-muted text-xs"
              >
                <StatusIcon size={14} className={`${status.color} flex-shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    {rule.roomLabel && (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full mr-2">
                        {rule.roomLabel}
                      </span>
                    )}
                    <span className="font-mono font-medium">{rule.clause}</span>
                    <Badge className={`text-[10px] py-0 ${status.color} bg-muted`}>
                      {status.text}
                    </Badge>
                    {rule.severity === "critical" && (
                      <Badge variant="destructive" className="text-[10px] py-0">
                        CRITICAL
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate">{rule.description}</p>
                  {rule.details && (
                    <p className="text-muted-foreground/70 text-[10px] mt-0.5">{rule.details}</p>
                  )}
                  {status.text === "Verify required" && (
                    <p className="text-xs text-amber-700 mt-1">
                      The drawing indicates a requirement that could not be confirmed. Check the cited dimension or assembly on the stamped drawings before permit submission.
                    </p>
                  )}
                  {status.text === "Not assessable from drawing" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This requirement could not be read from the drawing. Add the missing dimension or provide the referenced documentation for permit review.
                    </p>
                  )}
                  {status.text === "Non-compliant" && (
                    <p className="text-xs text-red-700 mt-1">
                      The detected condition does not meet the cited minimum. Correct it and update the permit drawings before submission.
                    </p>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Compliance Issues</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-xs border ${
                  issue.severity === "critical"
                    ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    : issue.severity === "major"
                    ? "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
                    : "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800"
                }`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="font-mono font-medium">{issue.clause}</span>
                  <Badge
                    variant={issue.severity === "critical" ? "destructive" : "secondary"}
                    className="text-[10px] py-0"
                  >
                    {issue.severity}
                  </Badge>
                </div>
                <p>{issue.description}</p>
                {issue.recommendation && (
                  <p className="text-muted-foreground mt-0.5">
                    → {issue.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Recommendations</p>
          <ul className="space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary flex-shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={() => setStep("credentials")} className="w-full">
        Proceed to Professional Review
      </Button>
    </div>
  );

  // ─── Step: Credentials ───────────────────────────────────────────────────────

  const renderCredentialsStep = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex gap-2 items-start">
          <User className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Professional Credentials Required:</span> Your license
            number and association will be permanently recorded in the audit trail alongside your
            approval or rejection decision.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-sm font-semibold">
            <Award className="w-3.5 h-3.5 inline mr-1" />
            Professional License Number
          </Label>
          <Input
            placeholder="e.g. P.Eng. 12345 or AACA 67890"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your professional engineering or architectural license number
          </p>
        </div>

        <div>
          <Label className="text-sm font-semibold">
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            Professional Association
          </Label>
          <Input
            placeholder="e.g. Professional Engineers Alberta (PEA)"
            value={professionalAssociation}
            onChange={(e) => setProfessionalAssociation(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Your professional licensing body
          </p>
        </div>

        <div>
          <Label className="text-sm font-semibold">
            <MapPin className="w-3.5 h-3.5 inline mr-1" />
            Jurisdiction
          </Label>
          <Input
            placeholder="e.g. Alberta, Canada"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Decision */}
      <div className="space-y-2 pt-2 border-t">
        <p className="text-sm font-semibold">Your Professional Decision</p>
        <div className="space-y-2">
          <label
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              decision === "approve"
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-border hover:bg-accent"
            }`}
          >
            <input
              type="radio"
              checked={decision === "approve"}
              onChange={() => {
                setDecision("approve");
                setRejectionReason("");
              }}
              className="w-4 h-4"
            />
            <div>
              <p className="font-semibold text-sm">Approve — Mark as VALID</p>
              <p className="text-xs text-muted-foreground">
                Analysis meets compliance requirements for regulatory submission
              </p>
            </div>
          </label>

          <label
            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
              decision === "reject"
                ? "border-red-500 bg-red-50 dark:bg-red-950"
                : "border-border hover:bg-accent"
            }`}
          >
            <input
              type="radio"
              checked={decision === "reject"}
              onChange={() => setDecision("reject")}
              className="w-4 h-4"
            />
            <div>
              <p className="font-semibold text-sm">Reject — Mark as REJECTED</p>
              <p className="text-xs text-muted-foreground">
                Analysis does not meet requirements or needs revision
              </p>
            </div>
          </label>
        </div>

        {decision === "reject" && (
          <div>
            <Label className="text-sm font-semibold">Rejection Reason (required)</Label>
            <Textarea
              placeholder="Explain why this analysis is being rejected and what corrections are needed..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1 min-h-[80px]"
            />
          </div>
        )}

        {decision === "approve" && (
          <div>
            <Label className="text-sm font-semibold">Validation Notes (optional)</Label>
            <Textarea
              placeholder="Any notes or conditions for this approval..."
              value={validationNotes}
              onChange={(e) => setValidationNotes(e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep("review")} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => setStep("confirm")}
          className="flex-1"
          disabled={
            !licenseNumber ||
            !professionalAssociation ||
            !jurisdiction ||
            !decision ||
            (decision === "reject" && !rejectionReason)
          }
        >
          Review & Confirm
        </Button>
      </div>
    </div>
  );

  // ─── Step: Confirm ───────────────────────────────────────────────────────────

  const renderConfirmStep = () => (
    <div className="space-y-4">
      <div
        className={`border rounded-lg p-3 ${
          decision === "approve"
            ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
        }`}
      >
        <div className="flex gap-2 items-start">
          {decision === "approve" ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`font-semibold text-sm ${
                decision === "approve"
                  ? "text-green-900 dark:text-green-100"
                  : "text-red-900 dark:text-red-100"
              }`}
            >
              {decision === "approve"
                ? "Confirm Approval — This action is IRREVERSIBLE"
                : "Confirm Rejection — This action is IRREVERSIBLE"}
            </p>
            <p
              className={`text-xs mt-1 ${
                decision === "approve"
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              By confirming, you certify under your professional credentials that this analysis
              {decision === "approve"
                ? " meets the applicable building code requirements."
                : " does not meet the applicable building code requirements."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted rounded-lg text-xs space-y-1.5">
        <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
          Audit Record Preview
        </p>
        <p>
          <span className="font-medium">Analysis ID:</span> #{analysisId}
        </p>
        <p>
          <span className="font-medium">Decision:</span>{" "}
          {decision === "approve" ? "PROFESSIONAL_ACCEPTED → VALID" : "PROFESSIONAL_REJECTED → REJECTED"}
        </p>
        <p>
          <span className="font-medium">License:</span> {licenseNumber}
        </p>
        <p>
          <span className="font-medium">Association:</span> {professionalAssociation}
        </p>
        <p>
          <span className="font-medium">Jurisdiction:</span> {jurisdiction}
        </p>
        {decision === "reject" && (
          <p>
            <span className="font-medium">Reason:</span> {rejectionReason}
          </p>
        )}
        {decision === "approve" && validationNotes && (
          <p>
            <span className="font-medium">Notes:</span> {validationNotes}
          </p>
        )}
        <p className="text-muted-foreground/70">
          Timestamp: {new Date().toISOString()} (server UTC will be used)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">Error</p>
          <p className="text-xs text-red-800 dark:text-red-200 mt-1">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setStep("credentials");
            setError(null);
          }}
          className="flex-1"
          disabled={isPending}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className={`flex-1 ${
            decision === "approve"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : decision === "approve" ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirm Approval
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Confirm Rejection
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // ─── Step Progress Indicator ─────────────────────────────────────────────────

  const steps = ["review", "credentials", "confirm", "complete"] as const;
  const currentStepIdx = steps.indexOf(step);

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader className="py-3 bg-blue-50 dark:bg-blue-950">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Professional Review — Analysis #{analysisId}
          <Badge variant="secondary" className="ml-auto text-xs">
            UNDER_REVIEW
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Step Progress */}
        <div className="flex gap-1 mb-4">
          {steps.map((s, idx) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                idx <= currentStepIdx ? "bg-blue-600" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === "review" && renderReviewStep()}
        {step === "credentials" && renderCredentialsStep()}
        {step === "confirm" && renderConfirmStep()}
      </CardContent>
    </Card>
  );
}
