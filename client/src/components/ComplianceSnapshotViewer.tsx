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

  const snapshots = trpc.compliance.getProjectSnapshots.useQuery({ projectId });
  const snapshot = trpc.compliance.getSnapshot.useQuery(
    { snapshotId: selectedSnapshot! },
    { enabled: !!selectedSnapshot }
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

  if (snapshots.isLoading) {
    return <div className="h-96 bg-gray-100 rounded animate-pulse" />;
  }

  if (!snapshots.data || snapshots.data.length === 0) {
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
        {snapshots.data.map((snap) => (
          <Card
            key={snap.snapshotId}
            className={`cursor-pointer transition-all ${selectedSnapshot === snap.snapshotId ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedSnapshot(snap.snapshotId)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(snap.complianceStatus)}
                  <div>
                    <CardTitle className="text-sm">
                      {snap.complianceStatus === "compliant"
                        ? "Compliant"
                        : snap.complianceStatus === "non_compliant"
                          ? "Non-Compliant"
                          : "Conditional"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(snap.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(snap.complianceStatus)} variant="outline">
                  {snap.mode}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1 text-gray-600">
                <p>
                  <span className="font-medium">Occupancy:</span> {snap.inputs.occupancy_major}
                </p>
                {snap.inputs.area_m2 && (
                  <p>
                    <span className="font-medium">Area:</span> {snap.inputs.area_m2}m²
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Snapshot Details */}
      {selectedSnapshot && snapshot.data && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Snapshot Details</CardTitle>
                <CardDescription>{snapshot.data.snapshotId}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="inputs" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="inputs">Inputs</TabsTrigger>
                <TabsTrigger value="outputs">Outputs</TabsTrigger>
                <TabsTrigger value="rules">Rules</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="inputs" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(snapshot.data.inputs).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 uppercase">{key.replace(/_/g, " ")}</div>
                      <div className="text-sm font-semibold mt-1">
                        {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="outputs" className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(snapshot.data.outputs, null, 2)}</pre>
                </div>
              </TabsContent>

              <TabsContent value="rules" className="space-y-3 mt-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {snapshot.data.ruleTrace.map((rule: any, idx: number) => (
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

              <TabsContent value="audit" className="space-y-4 mt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(snapshot.data.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-medium capitalize">{snapshot.data.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{snapshot.data.complianceStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ruleset:</span>
                    <span className="font-medium">{snapshot.data.rulesetId}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
