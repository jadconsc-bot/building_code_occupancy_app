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

  // @ts-ignore
  const snapshots = trpc.compliance.getHistory.useQuery({});
  const snapshotData = snapshots.data as any;

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

  if (!snapshotData?.analyses || snapshotData.analyses.length === 0) {
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
        {snapshotData?.analyses?.map((snap: any, idx: number) => (
          <Card
            key={idx}
            className={`cursor-pointer transition-all ${selectedSnapshot === String(idx) ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedSnapshot(String(idx))}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(snap.status || "conditional")}
                  <div>
                    <CardTitle className="text-sm">{snap.name || `Analysis ${idx + 1}`}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(snap.createdAt || Date.now()).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(snap.status || "conditional")}>
                  {snap.status || "pending"}
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
                <span className="font-medium">{snap.occupancyType || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Snapshot Details */}
      {selectedSnapshot !== null && snapshotData?.analyses?.[parseInt(selectedSnapshot)] && (
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
                    {JSON.stringify(snapshotData.analyses[parseInt(selectedSnapshot)]?.inputs || {}, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="outputs" className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(snapshotData.analyses[parseInt(selectedSnapshot)]?.outputs || {}, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="trace" className="space-y-4">
                <div className="space-y-2">
                  {(snapshotData.analyses[parseInt(selectedSnapshot)]?.ruleTrace || []).map((step: any, idx: number) => (
                    <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{step.rule || `Step ${idx + 1}`}</p>
                          <p className="text-xs text-gray-600">{step.description || "No description"}</p>
                        </div>
                        <Badge variant="outline">{step.result || "pending"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(snapshotData.analyses[parseInt(selectedSnapshot)]?.createdAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mode:</span>
                <span className="font-medium">{snapshotData.analyses[parseInt(selectedSnapshot)]?.mode || "soft"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusBadgeColor(snapshotData.analyses[parseInt(selectedSnapshot)]?.status || "pending")}>
                  {snapshotData.analyses[parseInt(selectedSnapshot)]?.status || "pending"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ruleset:</span>
                <span className="font-medium">{snapshotData.analyses[parseInt(selectedSnapshot)]?.rulesetId || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
