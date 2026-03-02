/**
 * ComplianceAnalyzer Component
 * Provides interface for running deterministic compliance analysis
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

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

export function ComplianceAnalyzer({ projectId }: { projectId: number }) {
  const { user } = useAuth();
  const [selectedRulesetId, setSelectedRulesetId] = useState<string>("");
  const [mode, setMode] = useState<"strict" | "soft">("soft");
  const [inputs, setInputs] = useState<ComplianceInput>({ occupancy_major: "" });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeCompliance = trpc.compliance.analyzePlan.useMutation();
  const analysisHistory = trpc.compliance.getHistory.useQuery();

  const handleInputChange = (key: string, value: string | number | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnalyze = async () => {
    if (!selectedRulesetId || !user) return;

    setLoading(true);
    try {
      const analysisResult = await analyzeCompliance.mutateAsync({
        projectId,
        rulesetId: selectedRulesetId,
        mode,
        inputs,
      });
      setResult(analysisResult);
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
            {rulesets.isLoading ? (
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            ) : (
              <Select value={selectedRulesetId} onValueChange={setSelectedRulesetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select code edition..." />
                </SelectTrigger>
                <SelectContent>
                  {rulesets.data?.map((rs) => (
                    <SelectItem key={rs.rulesetId} value={rs.rulesetId}>
                      {rs.code} {rs.edition}
                      {rs.amendment ? ` (${rs.amendment})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    {new Date(result.timestamp).toLocaleString()}
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
            <Button variant="outline" className="w-full mt-6" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
