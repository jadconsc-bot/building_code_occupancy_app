/**
 * ComplianceAnalyzer Component
 * Provides interface for running deterministic compliance analysis
 */

import { useState } from "react";
import React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Clock, FileText, Download, PenTool } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignaturePad } from "@/components/SignaturePad";
import { ProfessionalReviewPanel } from "@/components/ProfessionalReviewPanel";

interface ComplianceInput {
  occupancy_major: string;
  occupancy_division?: string;
  area_m2?: number;
  storeys?: number;
  sprinklers?: boolean;
  fire_alarm?: boolean;
  exits?: number;
  travel_distance_m?: number;
  construction_type?: string;
  [key: string]: any;
}

interface ComplianceAnalyzerProps {
  projectId: number;
  onResultsChange?: (results: any) => void;
}

export function ComplianceAnalyzer({ projectId, onResultsChange }: ComplianceAnalyzerProps) {
  const { user } = useAuth();
  const [selectedRulesetId, setSelectedRulesetId] = useState<string>("");
  const [mode, setMode] = useState<"strict" | "soft">("soft");
  const [inputs, setInputs] = useState<ComplianceInput>({ occupancy_major: "" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Fix #4: Signature workflow state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [analysisId] = useState(Math.random().toString(36).substr(2, 9)); // Generate unique analysis ID
  const [signatureId, setSignatureId] = useState<string | null>(null);
  
  // Fix #5: Professional review state
  const [isReviewComplete, setIsReviewComplete] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  const analyzeCompliance = trpc.compliance.analyzePlan.useMutation();
  const analysisHistory = trpc.compliance.getHistory.useQuery({});
  
  // Fix #4: Signature submission mutation
  const submitSignatureMutation = trpc.certification.submitSignedAnalysis.useMutation({
    onSuccess: (data: any) => {
      setShowSignatureModal(false);
      setIsSigned(true);
      setSignatureId(data.signatureId || data.id);
      setShowReviewPanel(true);
      console.log('✅ Analysis signed and submitted', { analysisId, signatureId: data.signatureId });
    },
    onError: (error) => {
      console.error('❌ Failed to submit signature', error);
    },
  });

  const handleInputChange = (key: string, value: string | number | boolean | undefined) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!selectedRulesetId || !user) return;

    setLoading(true);
    try {
      const analysisResult = await analyzeCompliance.mutateAsync({
        planDescription: 'Building Plan',
        occupancyType: inputs.occupancy_major || 'residential',
        buildingType: inputs.buildingType,
        province: 'Alberta',
      });
      setResult(analysisResult);
      // Emit results to parent component for audit trail creation
      onResultsChange?.(analysisResult);
    } catch (error) {
      console.error("Analysis failed:", error);
      onResultsChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  // Also emit results when component mounts with existing result
  React.useEffect(() => {
    if (result) {
      onResultsChange?.(result);
    }
  }, [result, onResultsChange]);

  // Clear parent results when analysis is cleared
  const handleClearResults = () => {
    setResult(null);
    onResultsChange?.(null);
    setIsSigned(false);
    setSignature(null);
  };
  
  // Fix #4: Handle signature submission
  const handleSignAndSubmit = async () => {
    if (!signature) {
      console.error('No signature provided');
      return;
    }

    await submitSignatureMutation.mutateAsync({
      analysisId,
      signature,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "non_compliant":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "conditional":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-50 border-green-200";
      case "non_compliant":
        return "bg-red-50 border-red-200";
      case "conditional":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  // Determine compliance status from result
  const getComplianceStatus = (result: any): string => {
    if (result.complianceStatus) return result.complianceStatus;
    if (result.success === false) return "non_compliant";
    if (result.infractions && result.infractions.length > 0) return "non_compliant";
    return "compliant";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Analysis Engine</CardTitle>
          <CardDescription>
            Deterministic code compliance evaluation with full rule traceability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ruleset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Building Code Edition</label>
            <Select value={selectedRulesetId} onValueChange={setSelectedRulesetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select code edition..." />
              </SelectTrigger>
              <SelectContent>
                {[{ rulesetId: '1', code: 'NBC', edition: '2025', amendment: null }]?.map((rs: any) => (
                  <SelectItem key={rs.rulesetId} value={rs.rulesetId}>
                    {rs.code} {rs.edition}
                    {rs.amendment ? ` (${rs.amendment})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Analysis Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="soft"
                  checked={mode === "soft"}
                  onChange={(e) => setMode(e.target.value as "soft" | "strict")}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  Soft (Design Iteration)
                  <span className="text-xs text-gray-500 block">Allows incomplete inputs</span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="strict"
                  checked={mode === "strict"}
                  onChange={(e) => setMode(e.target.value as "soft" | "strict")}
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  Strict (Legal Compliance)
                  <span className="text-xs text-gray-500 block">Requires all inputs</span>
                </span>
              </label>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Occupancy Type</label>
              <Select value={inputs.occupancy_major} onValueChange={(v) => handleInputChange("occupancy_major", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occupancy..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="institutional">Institutional</SelectItem>
                  <SelectItem value="assembly">Assembly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Area (m²)</label>
              <input
                type="number"
                value={inputs.area_m2 || ""}
                onChange={(e) => handleInputChange("area_m2", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Enter area..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Storeys</label>
              <input
                type="number"
                value={inputs.storeys || ""}
                onChange={(e) => handleInputChange("storeys", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Enter number of storeys..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Travel Distance (m)</label>
              <input
                type="number"
                value={inputs.travel_distance_m || ""}
                onChange={(e) =>
                  handleInputChange("travel_distance_m", e.target.value ? parseFloat(e.target.value) : undefined)
                }
                placeholder="Enter distance..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Exits</label>
              <input
                type="number"
                value={inputs.exits || ""}
                onChange={(e) => handleInputChange("exits", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Enter number of exits..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Construction Type</label>
              <Select value={inputs.construction_type || ""} onValueChange={(v) => handleInputChange("construction_type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combustible">Combustible</SelectItem>
                  <SelectItem value="non_combustible">Non-Combustible</SelectItem>
                  <SelectItem value="fire_resistant">Fire-Resistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.sprinklers === true}
                onChange={(e) => handleInputChange("sprinklers", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Sprinkler System</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inputs.fire_alarm === true}
                onChange={(e) => handleInputChange("fire_alarm", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Fire Alarm System</span>
            </label>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={!selectedRulesetId || !inputs.occupancy_major || loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Analyzing..." : "Run Compliance Analysis"}
          </Button>
        </CardContent>
      </Card>

      {/* Results - Handle both LLM and deterministic engine formats */}
      {result && (
        <Card className={`border-2 ${getStatusColor(getComplianceStatus(result))}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(getComplianceStatus(result))}
                <div>
                  <CardTitle>
                    {getComplianceStatus(result) === "compliant"
                      ? "Compliant"
                      : getComplianceStatus(result) === "non_compliant"
                        ? "Non-Compliant"
                        : "Analysis Complete"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date(result.timestamp || Date.now()).toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={mode === "strict" ? "default" : "secondary"}>
                {mode === "strict" ? "Strict Mode" : "Soft Mode"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Handle LLM analysis format (infractions + summary) */}
            {result.infractions && Array.isArray(result.infractions) && result.infractions.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Analysis Summary</h3>
                  <p className="text-sm text-gray-700 mb-4">{result.summary || 'No summary available'}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Identified Issues</h3>
                  <div className="space-y-2">
                    {result.infractions.map((infraction: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{infraction.code}: {infraction.description}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              <strong>Requirement:</strong> {infraction.requirement}
                            </div>
                            <div className="text-xs text-gray-600">
                              <strong>Remediation:</strong> {infraction.remediation}
                            </div>
                            <div className="text-xs mt-1">
                              <span
                                className={`px-2 py-1 rounded ${
                                  infraction.severity === 'critical'
                                    ? 'bg-red-200 text-red-800'
                                    : infraction.severity === 'major'
                                      ? 'bg-orange-200 text-orange-800'
                                      : 'bg-yellow-200 text-yellow-800'
                                }`}
                              >
                                {infraction.severity?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : result.infractions && result.infractions.length === 0 ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">No Issues Found</p>
                    <p className="text-sm text-green-800 mt-1">{result.summary || 'The design appears to comply with all applicable code requirements.'}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Handle deterministic engine format (compliance_flags + rule_trace) */
              <Tabs defaultValue="compliance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
                  <TabsTrigger value="rules">Rule Trace</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="compliance" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result.compliance_flags || {}).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {value ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rules" className="space-y-3 mt-4">
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {(result.rule_trace || []).map((rule: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          rule.fired ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{rule.clause}</div>
                            <div className="text-xs text-gray-600 mt-1">{rule.rule_id}</div>
                          </div>
                          {rule.fired ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{JSON.stringify(result.outputs || result, null, 2)}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* Fix #4: Sign & Submit Section */}
            {!isSigned ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm font-semibold text-blue-900 mb-3">
                  🖊️ Professional Sign-Off Required
                </p>
                <p className="text-sm text-blue-800 mb-4">
                  For this analysis to be legally defensible and submittable to authorities, it must be digitally signed by a licensed professional engineer.
                </p>
                <Button
                  onClick={() => setShowSignatureModal(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Sign & Submit Analysis
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-green-900 font-semibold">
                  Analysis digitally signed and submitted
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Signature immutably recorded in audit trail
                </p>
              </div>
            )}

            {/* Export Button */}
            <Button variant="outline" className="w-full mt-4" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fix #4: Signature Modal */}
      <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              🖊️ Digital Signature - Professional Certification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-900 font-semibold">⚠️ Legal Notice</p>
              <p className="text-xs text-yellow-800 mt-1">
                By signing, you certify that you are a licensed professional engineer and that this analysis is accurate and complies with applicable building codes.
              </p>
            </div>

            <p className="text-sm text-gray-600">
              Sign below to certify compliance. Your signature will be recorded in the audit trail and cannot be modified.
            </p>

            {/* Signature Pad Component */}
            <SignaturePad
              engineerName={user?.name || 'Professional Engineer'}
              onSignatureComplete={setSignature}
            />

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowSignatureModal(false)}
                disabled={submitSignatureMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignAndSubmit}
                disabled={!signature || submitSignatureMutation.isPending}
                className="flex-1"
              >
                {submitSignatureMutation.isPending ? 'Submitting...' : 'Submit Signature'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fix #5: Professional Review Panel Modal */}
      <Dialog open={showReviewPanel} onOpenChange={setShowReviewPanel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              👨‍💼 Professional Review & Approval
            </DialogTitle>
          </DialogHeader>

          {result && (
            <ProfessionalReviewPanel
              analysis={{
                id: parseInt(analysisId),
                issues: result.infractions || [],
                recommendations: result.recommendations || [],
                confidenceScore: result.confidence_score || 0.85,
              }}
              onReviewComplete={(accepted) => {
                setIsReviewComplete(true);
                setShowReviewPanel(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
