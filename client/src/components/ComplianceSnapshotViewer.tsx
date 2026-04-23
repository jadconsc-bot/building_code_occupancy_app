/**
 * ComplianceSnapshotViewer Component
 * Displays saved compliance snapshots with full traceability
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Download, Trash2, Eye } from "lucide-react";

export function ComplianceSnapshotViewer({ projectId }: { projectId: number }) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

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
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
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

              <TabsContent value="outputs" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(selected.outputs || {}, null, 2)}
                  </pre>
                </div>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
