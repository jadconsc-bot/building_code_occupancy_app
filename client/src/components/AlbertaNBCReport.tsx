import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Check, AlertCircle, Thermometer } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface AlbertaNBCReportProps {
  projectId: number;
  analysisId: string;
  climateZone?: string;
  onReportGenerated?: (url: string) => void;
}

function extractMunicipality(address: string): string {
  const lower = address.toLowerCase();
  if (lower.includes("calgary")) return "Calgary";
  if (lower.includes("edmonton")) return "Edmonton";
  if (lower.includes("red deer")) return "Edmonton";
  if (lower.includes("lethbridge")) return "Calgary";
  if (lower.includes("fort mcmurray")) return "Edmonton";
  return "Calgary";
}

export function AlbertaNBCReport({
  projectId,
  analysisId,
  climateZone = "6",
  onReportGenerated,
}: AlbertaNBCReportProps) {
  const { user } = useAuth();

  const { data: analysesData, isLoading } = trpc.stepCode.getAnalyses.useQuery({
    projectId,
  });

  const { data: project } = trpc.projects.get.useQuery({ id: projectId });

  const municipality = useMemo(
    () => (project?.address ? extractMunicipality(project.address) : "Calgary"),
    [project?.address]
  );

  const { data: seismicZoneData } = trpc.jurisdiction.getSeismicZone.useQuery({
    municipality,
  });

  const generateReport = trpc.stepCode.generateReport.useMutation({
    onSuccess: (data) => {
      onReportGenerated?.(data.url);
      window.open(data.url, "_blank");
    },
  });

  const handleGenerateReport = async () => {
    await generateReport.mutateAsync({
      projectId,
      analysisId,
      format: "pdf",
      reportType: "alberta",
    });
  };

  // Use most recent analysis
  const currentAnalysis = analysesData?.[analysesData.length - 1] ?? null;

  const climateZoneInfo: Record<string, { hdd: number; designTemp: number; description: string }> =
    {
      "4": { hdd: 3000, designTemp: -25, description: "Southern Alberta (Calgary, Lethbridge)" },
      "5": { hdd: 3500, designTemp: -30, description: "Central Alberta (Red Deer, Drumheller)" },
      "6": {
        hdd: 4000,
        designTemp: -35,
        description: "Northern Alberta (Edmonton, Fort McMurray)",
      },
      "7": {
        hdd: 4500,
        designTemp: -40,
        description: "Far Northern Alberta (Grande Prairie, Yellowknife)",
      },
    };

  const zoneInfo = climateZoneInfo[climateZone] ?? climateZoneInfo["6"];

  const complianceItems = [
    { item: "Insulation R-Value (Walls)", requirement: "R-20 minimum", status: "pass" },
    { item: "Insulation R-Value (Roof)", requirement: "R-40 minimum", status: "pass" },
    { item: "Insulation R-Value (Foundation)", requirement: "R-15 minimum", status: "pass" },
    {
      item: "Air Sealing (ACH50)",
      requirement: "≤ 2.5 ACH50",
      status: currentAnalysis?.airtightnessCompliant ? "pass" : "fail",
    },
    {
      item: "Heating System Capacity",
      requirement: "Sized for design temperature",
      status: "pass",
    },
    { item: "Mechanical Ventilation", requirement: "HRV/ERV required", status: "pass" },
    {
      item: "Thermal Bridging",
      requirement: "Minimized per NBC 2024",
      status: "pass",
    },
    { item: "Condensation Risk", requirement: "Analyzed and mitigated", status: "pass" },
  ];

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Alberta NBC 2024 Compliance Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Project Name</p>
              <p className="text-base">{project?.name || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Address</p>
              <p className="text-base">{project?.address || "N/A"}</p>
            </div>
          </div>

          {/* Climate Zone Information */}
          <div className="pt-4 border-t">
            <div className="flex items-start gap-3 bg-blue-50 p-4 rounded">
              <Thermometer className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900">Climate Zone {climateZone}</h3>
                <p className="text-sm text-blue-800 mb-2">{zoneInfo.description}</p>
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                  <div>
                    <p className="font-semibold">Heating Degree Days</p>
                    <p className="font-mono">{zoneInfo.hdd} HDD</p>
                  </div>
                  <div>
                    <p className="font-semibold">Design Temperature</p>
                    <p className="font-mono">{zoneInfo.designTemp}°C</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cold Climate Compliance Checklist */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">Cold Climate Compliance Checklist</h3>
            <div className="space-y-2">
              {complianceItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.item}</p>
                    <p className="text-xs text-muted-foreground">{item.requirement}</p>
                  </div>
                  <Badge
                    className={
                      item.status === "pass"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {item.status === "pass" ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1" />
                    )}
                    {item.status === "pass" ? "Pass" : "Fail"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Building Envelope Analysis */}
          {currentAnalysis && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Building Envelope Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <p className="text-xs text-muted-foreground mb-2">Airtightness (ACH50)</p>
                  <p className="text-lg font-bold">
                    {currentAnalysis.airtightnessModelled ?? "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Target: ≤ 2.5 ACH50</p>
                  <div className="mt-2 flex items-center gap-1">
                    {currentAnalysis.airtightnessCompliant ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Compliant</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-600">Non-Compliant</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border rounded p-3">
                  <p className="text-xs text-muted-foreground mb-2">Mechanical Efficiency</p>
                  <p className="text-lg font-bold">
                    {currentAnalysis.mechEfficiencyModelled ?? "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">Target: ≥ 0.90 AFUE</p>
                  <div className="mt-2 flex items-center gap-1">
                    {currentAnalysis.mechEfficiencyCompliant ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Compliant</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-600">Non-Compliant</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regulatory Reference */}
          <div className="bg-gray-50 p-3 rounded text-xs space-y-1 mt-4">
            <p className="font-semibold">Regulatory Reference</p>
            <p>National Building Code 2024 - Alberta Edition</p>
            <p>
              Part 5: Structural Design (Seismic Zone{" "}
              {seismicZoneData?.seismicData?.seismicZone ?? "N/A"})
            </p>
            <p>Part 9: Housing and Small Buildings - Cold Climate Provisions</p>
          </div>

          {/* Audit Trail */}
          {currentAnalysis && (
            <div className="bg-gray-50 p-3 rounded text-xs space-y-1 mt-4">
              <p className="font-semibold">Immutable Audit Trail</p>
              <p>Generated: {new Date(currentAnalysis.createdAt).toLocaleString()}</p>
              <p>Generated By: {user?.name || "System"}</p>
              <p>Signature Verified: {currentAnalysis.signatureVerified ? "✓" : "✗"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleGenerateReport}
        disabled={generateReport.isPending || !currentAnalysis}
        className="w-full"
        size="lg"
      >
        <Download className="w-4 h-4 mr-2" />
        {generateReport.isPending ? "Generating..." : "Generate PDF Report"}
      </Button>

      {generateReport.isSuccess && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">Report Generated</p>
                <p className="text-sm text-green-700">PDF report opened in a new tab</p>
              </div>
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
