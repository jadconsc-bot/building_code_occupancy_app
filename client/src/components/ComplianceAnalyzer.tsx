/**
 * ComplianceAnalyzer Component
 * Provides interface for running deterministic compliance analysis
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useJurisdiction } from "@/_core/hooks/useJurisdiction";
import { MapPin } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "sonner";

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

const BUILDING_TYPE_TO_CONSTRUCTION: Record<string, string> = {
  part9_single_family: "combustible",
  part9_multiplex: "combustible",
  part3_residential: "non_combustible",
  part3_commercial: "non_combustible",
  part3_industrial: "non_combustible",
};

export function ComplianceAnalyzer({
  projectId,
  onResult,
  initialOccupancy,
  initialProvince,
  initialBuildingType,
  initialArea,
  persistedInputs,
  onInputsChange,
}: {
  projectId: number;
  onResult?: (result: any) => void;
  initialOccupancy?: string;
  initialProvince?: string;
  initialBuildingType?: string;
  initialArea?: number;
  persistedInputs?: ComplianceInput | null;
  onInputsChange?: (inputs: ComplianceInput) => void;
}) {
  const { user } = useAuth();
  const { jurisdiction, isGeocoded } = useJurisdiction(projectId);
  const [userHasManuallyOverridden, setUserHasManuallyOverridden] = useState(false);
  const [selectedRulesetId, setSelectedRulesetId] = useState<string>("");
  const [mode, setMode] = useState<"strict" | "soft">("soft");
  const [inputs, setInputs] = useState<ComplianceInput>(
    persistedInputs ?? {
      occupancy_major: initialOccupancy ? initialOccupancy.charAt(0) : "",
      province: initialProvince ?? undefined,
      construction_type: initialBuildingType
        ? (BUILDING_TYPE_TO_CONSTRUCTION[initialBuildingType] ?? undefined)
        : undefined,
      area_m2: initialArea && initialArea > 0 ? initialArea : undefined,
    }
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [areaTouched, setAreaTouched] = useState(false);

  useEffect(() => {
    onInputsChange?.(inputs);
  }, [inputs]);

  useEffect(() => {
    if (initialOccupancy || initialProvince || initialBuildingType) {
      setAreaTouched(false);
      setInputs(prev => ({
        ...prev,
        occupancy_major: initialOccupancy ? initialOccupancy.charAt(0) : prev.occupancy_major,
        province: initialProvince ?? prev.province,
        construction_type: initialBuildingType
          ? (BUILDING_TYPE_TO_CONSTRUCTION[initialBuildingType] ?? prev.construction_type)
          : prev.construction_type,
      }));
    }
  }, [initialOccupancy, initialProvince, initialBuildingType]);

  // Auto-populate province/municipality from geocoded jurisdiction
  useEffect(() => {
    if (!jurisdiction?.province || userHasManuallyOverridden) return;
    setInputs(prev => ({
      ...prev,
      province: jurisdiction.province,
      municipality: jurisdiction.municipality || prev.municipality,
    }));
  }, [jurisdiction, userHasManuallyOverridden]);

  const analyzeMutation = trpc.compliance.analyzeCompliance.useMutation();
  const { data: rulesets } = trpc.compliance.getRulesets.useQuery();

  const handleInputChange = (key: string, value: string | number | boolean | undefined) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!selectedRulesetId || !user) return;

    setLoading(true);
    try {
      const analysisResult = await analyzeMutation.mutateAsync({
        projectId,
        rulesetId: selectedRulesetId,
        mode,
        inputs,
      });
      const resultWithInputs = { ...analysisResult, inputs };
      setResult(analysisResult);
      onResult?.(resultWithInputs);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
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

  const handleExportPDF = () => {
    if (!result) {
      toast.error("Run an analysis first before exporting.");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      // Branded header
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("CodeComply", 14, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Building Code Compliance Report", pageWidth - 14, 12, { align: "right" });
      doc.setTextColor(0, 0, 0);
      y = 24;

      // Status banner
      const statusColor: [number, number, number] =
        result.complianceStatus === "compliant" ? [22, 163, 74] :
        result.complianceStatus === "non_compliant" ? [185, 28, 28] :
        [202, 138, 4];
      doc.setFillColor(...statusColor);
      doc.rect(margin, y, pageWidth - margin * 2, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(
        result.complianceStatus === "compliant" ? "COMPLIANT" :
        result.complianceStatus === "non_compliant" ? "NON-COMPLIANT" : "CONDITIONAL",
        pageWidth / 2, y + 8, { align: "center" }
      );
      doc.setTextColor(0, 0, 0);
      y += 18;

      // Divider + Analysis Inputs
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Analysis Inputs", margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      Object.entries(result.inputs ?? {}).forEach(([key, val]) => {
        doc.text(`${key.replace(/_/g, " ")}: ${val}`, margin, y);
        y += 5;
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
      });

      // Divider + Compliance Flags
      y += 3;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Compliance Checks", margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      Object.entries(result.compliance_flags ?? {}).forEach(([key, val]) => {
        doc.text(`${key.replace(/_/g, " ")}: ${val ? "PASS" : "FAIL"}`, margin, y);
        y += 5;
        if (y > pageHeight - 20) { doc.addPage(); y = 20; }
      });

      // Footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(
          `CodeComply PD2.0 — Page ${i} of ${pageCount} — buildingcodeoccupancyapp-production-4adf.up.railway.app`,
          pageWidth / 2, pageHeight - 8, { align: "center" }
        );
      }

      doc.save(`compliance-analysis-${Date.now()}.pdf`);
      toast.success("PDF exported successfully.");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF export failed: " + (err instanceof Error ? err.message : String(err)));
    }
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
          {/* Jurisdiction source indicator */}
          {isGeocoded && (
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2.5 py-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>
                Jurisdiction auto-detected from project address —{' '}
                <strong>{jurisdiction?.province}</strong>
                {jurisdiction?.municipality ? `, ${jurisdiction.municipality}` : ''}
                {' '}({jurisdiction?.codeEdition})
              </span>
              <button
                className="ml-auto text-green-700 underline hover:no-underline"
                onClick={() => setUserHasManuallyOverridden(true)}
              >
                Override
              </button>
            </div>
          )}

          {/* Ruleset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Building Code Edition</label>
            <Select value={selectedRulesetId} onValueChange={setSelectedRulesetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select code edition..." />
              </SelectTrigger>
              <SelectContent>
                {(rulesets ?? []).map((rs: any) => (
                  <SelectItem key={rs.rulesetId} value={rs.rulesetId}>
                    {rs.code} {rs.edition}
                    {rs.amendment ? ` (${rs.amendment})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rulesets && rulesets.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No ruleset available. Contact your administrator.</p>
            )}
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
                  <SelectItem value="A">Assembly (A)</SelectItem>
                  <SelectItem value="B">Institutional (B)</SelectItem>
                  <SelectItem value="C">Residential (C)</SelectItem>
                  <SelectItem value="D">Office / Business (D)</SelectItem>
                  <SelectItem value="E">Mercantile (E)</SelectItem>
                  <SelectItem value="F">Industrial (F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Area (m²)</label>
              <input
                type="number"
                value={inputs.area_m2 || ""}
                onChange={(e) => handleInputChange("area_m2", e.target.value ? parseFloat(e.target.value) : undefined)}
                onBlur={() => setAreaTouched(true)}
                placeholder="Enter area..."
                className={`w-full px-3 py-2 border rounded-md ${
                  mode === "strict" && areaTouched && !inputs.area_m2
                    ? "border-red-400"
                    : "border-gray-300"
                }`}
              />
              {mode === "strict" && areaTouched && !inputs.area_m2 && (
                <p className="text-xs text-red-600">Area is required for compliance analysis</p>
              )}
              {mode === "soft" && inputs.occupancy_major && !inputs.area_m2 && (
                <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                  Area not provided — occupant load estimate will not be available
                </p>
              )}
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
            disabled={!selectedRulesetId || !inputs.occupancy_major || (mode === "strict" && !inputs.area_m2) || loading || !rulesets?.length}
            className="w-full"
            size="lg"
          >
            {loading ? "Analyzing..." : "Run Compliance Analysis"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={`border-2 ${getStatusColor(result.complianceStatus)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.complianceStatus)}
                <div>
                  <CardTitle>
                    {result.complianceStatus === "compliant"
                      ? "Compliant"
                      : result.complianceStatus === "non_compliant"
                        ? "Non-Compliant"
                        : "Conditional"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleString()}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={mode === "strict" ? "default" : "secondary"}>
                {mode === "strict" ? "Strict Mode" : "Soft Mode"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="compliance" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="compliance">Compliance Status</TabsTrigger>
                <TabsTrigger value="rules">Rule Trace</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="compliance" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result.compliance_flags).map(([key, value]) => (
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
                  {result.rule_trace.map((rule: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${rule.fired ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
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
                  <pre>{JSON.stringify(result.outputs, null, 2)}</pre>
                </div>
              </TabsContent>
            </Tabs>

            {/* Export Button */}
            <Button variant="outline" className="w-full mt-6" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
