/**
 * ComplianceSnapshotViewer Component
 * Displays saved compliance snapshots with full traceability
 */

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Download, Trash2 } from "lucide-react";

const KNOWN_OUTPUT_FIELDS: Array<{ key: string; label: string; suffix?: string }> = [
  { key: "occupant_load", label: "Occupant Load", suffix: " persons" },
  { key: "exits_required", label: "Exits Required" },
  { key: "travel_distance_max", label: "Max Travel Distance", suffix: " m" },
  { key: "fire_resistance_rating", label: "Fire Resistance Rating" },
];

const KNOWN_OUTPUT_KEYS = new Set([
  "compliance_status",
  ...KNOWN_OUTPUT_FIELDS.map((f) => f.key),
]);

const OUTPUT_PDF_LABELS: Record<string, string> = {
  occupant_load: "Occupant Load",
  exits_required: "Exits Required",
  travel_distance_max: "Max Travel Distance (m)",
  fire_resistance_rating: "Fire Resistance Rating",
  compliance_status: "Overall Status",
};

export function ComplianceSnapshotViewer({ projectId }: { projectId: number }) {
  const { user } = useAuth();
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const snapshots = trpc.compliance.getProjectSnapshots.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800";
      case "non_compliant":
        return "bg-red-100 text-red-800";
      case "conditional":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const snapshotList = snapshots.data ?? [];
  const selected = selectedSnapshot !== null ? snapshotList[parseInt(selectedSnapshot)] : null;

  const handleExport = () => {
    if (!selected) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Compliance Analysis Snapshot", pageWidth / 2, y, { align: "center" });
      y += 8;

      // Status banner
      const rawStatus = selected.complianceStatus || "unknown";
      const isCompliant = rawStatus === "compliant";
      const isNonCompliant = rawStatus === "non_compliant";
      doc.setFontSize(12);
      doc.setTextColor(
        isCompliant ? 22 : 185,
        isCompliant ? 163 : 28,
        isCompliant ? 74 : 28
      );
      doc.text(
        isCompliant ? "COMPLIANT" : isNonCompliant ? "NON-COMPLIANT" : rawStatus.toUpperCase(),
        pageWidth / 2,
        y,
        { align: "center" }
      );
      doc.setTextColor(0, 0, 0);
      y += 10;

      // Snapshot metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Snapshot Information", 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const analystName =
        (user as any)?.name ?? (user as any)?.email ?? (user as any)?.username ?? "Authenticated User";
      doc.text(`Snapshot ID: ${selected.snapshotId ?? "N/A"}`, 14, y); y += 5;
      doc.text(`Analysis Date: ${new Date(selected.createdAt || Date.now()).toLocaleString()}`, 14, y); y += 5;
      doc.text(`Analyst: ${analystName}`, 14, y); y += 5;
      doc.text(`Ruleset: ${selected.rulesetId ?? "N/A"}`, 14, y); y += 5;
      doc.text(`Mode: ${selected.mode ?? "soft"}`, 14, y); y += 10;

      // Inputs table
      const inputRows = Object.entries(selected.inputs || {}).map(([k, v]) => [
        k.replace(/_/g, " "),
        String(v),
      ]);
      if (inputRows.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("Analysis Inputs", 14, y); y += 4;
        autoTable(doc, {
          startY: y,
          head: [["Field", "Value"]],
          body: inputRows,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 58, 138] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Outputs table
      const outputRows = Object.entries(selected.outputs || {}).map(([k, v]) => [
        OUTPUT_PDF_LABELS[k] ?? k.replace(/_/g, " "),
        k === "occupant_load" ? `${v} persons`
          : k === "travel_distance_max" ? `${v} m`
          : String(v),
      ]);
      if (outputRows.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text("Analysis Outputs", 14, y); y += 4;
        autoTable(doc, {
          startY: y,
          head: [["Output", "Value"]],
          body: outputRows,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 58, 138] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Rule trace table
      const traceRows = (selected.ruleTrace || []).map((step: any) => [
        step.rule_id ?? "",
        step.clause ?? "",
        step.fired ? "PASS" : "FAIL",
      ]);
      if (traceRows.length > 0) {
        if (y > 220) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text("Rule Trace", 14, y); y += 4;
        autoTable(doc, {
          startY: y,
          head: [["Rule ID", "Description", "Result"]],
          body: traceRows,
          didParseCell: (data) => {
            if (data.column.index === 2 && data.section === "body") {
              data.cell.styles.textColor =
                data.cell.raw === "PASS" ? [22, 163, 74] : [185, 28, 28];
            }
          },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [30, 58, 138] },
        });
        y = (doc as any).lastAutoTable.finalY + 8;
      }

      // Footer
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Immutable compliance snapshot — National Building Code of Canada",
        14, y
      ); y += 4;
      doc.text(`Snapshot ID: ${selected.snapshotId ?? "N/A"}`, 14, y);

      const snapId = selected.snapshotId?.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) ?? "snapshot";
      doc.save(`compliance-snapshot-${snapId}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  if (snapshots.isLoading) {
    return <div className="h-96 bg-gray-100 rounded animate-pulse" />;
  }

  if (snapshotList.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No compliance snapshots yet. Run an analysis to create one.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Snapshots List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {snapshotList.map((snap: any, idx: number) => (
          <Card
            key={snap.snapshotId ?? idx}
            className={`cursor-pointer transition-all ${selectedSnapshot === String(idx) ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedSnapshot(String(idx))}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(snap.complianceStatus || "conditional")}
                  <div>
                    <CardTitle className="text-sm">{`Analysis ${idx + 1}`}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(snap.createdAt || Date.now()).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(snap.complianceStatus || "conditional")}>
                  {snap.complianceStatus || "pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium">{snap.mode || "soft"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Occupancy:</span>
                <span className="font-medium">{snap.inputs?.occupancy_major ?? snap.inputs?.occupancyType ?? "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Snapshot Details */}
      {selected && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Snapshot Details</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="inputs" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="outputs">Outputs</TabsTrigger>
                <TabsTrigger value="trace">Trace</TabsTrigger>
              </TabsList>

              <TabsContent value="inputs" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selected.inputs || {}, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="outputs" className="space-y-2 mt-4">
                {!selected.outputs || Object.keys(selected.outputs).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No output data available.</p>
                ) : (
                  <>
                    {/* Compliance status badge row */}
                    {selected.outputs.compliance_status !== undefined && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">Overall Status</span>
                        <Badge
                          className={
                            selected.outputs.compliance_status === "pass"
                              ? "bg-green-100 text-green-800"
                              : selected.outputs.compliance_status === "fail"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {selected.outputs.compliance_status === "pass"
                            ? "PASS"
                            : selected.outputs.compliance_status === "fail"
                            ? "FAIL"
                            : String(selected.outputs.compliance_status).toUpperCase()}
                        </Badge>
                      </div>
                    )}

                    {/* Known formatted fields */}
                    {KNOWN_OUTPUT_FIELDS.filter(
                      (f) => selected.outputs[f.key] !== undefined
                    ).map((f) => (
                      <div
                        key={f.key}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-600">{f.label}</span>
                        <span className="text-sm font-medium">
                          {String(selected.outputs[f.key])}{f.suffix ?? ""}
                        </span>
                      </div>
                    ))}

                    {/* Any additional rule-set outputs */}
                    {Object.entries(selected.outputs)
                      .filter(([k]) => !KNOWN_OUTPUT_KEYS.has(k))
                      .map(([k, v]) => (
                        <div
                          key={k}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-600 capitalize">
                            {k.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm font-medium">{String(v)}</span>
                        </div>
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="trace" className="space-y-4">
                {(selected.ruleTrace || []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No rule trace available.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 font-medium text-gray-600 w-32">Rule ID</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600">Description</th>
                          <th className="text-center px-3 py-2 font-medium text-gray-600 w-24">Result</th>
                          <th className="text-left px-3 py-2 font-medium text-gray-600 w-32">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.ruleTrace || []).map((step: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-xs text-gray-700 align-top">
                              {step.rule_id || `rule-${idx + 1}`}
                            </td>
                            <td className="px-3 py-2 text-gray-800 align-top">
                              {step.clause || "—"}
                            </td>
                            <td className="px-3 py-2 text-center align-top">
                              <Badge
                                variant="outline"
                                className={
                                  step.fired
                                    ? "text-green-700 border-green-300 bg-green-50"
                                    : "text-red-700 border-red-300 bg-red-50"
                                }
                              >
                                {step.fired ? "PASS" : "FAIL"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500 align-top">
                              {step.conditions_met !== undefined
                                ? `Conditions ${step.conditions_met ? "met" : "not met"}`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(selected.createdAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium">{selected.mode || "soft"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusBadgeColor(selected.complianceStatus || "pending")}>
                  {selected.complianceStatus || "pending"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ruleset:</span>
                <span className="font-medium">{selected.rulesetId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Signature:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {selected.snapshotId?.slice(0, 16) ?? "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
