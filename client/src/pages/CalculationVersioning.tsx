/**
 * Calculation Versioning & History Page
 * Phase 2C: One-click recalculation with version preservation
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Copy, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function CalculationVersioning() {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const handleCreateNewVersion = () => {
    toast.info("Open a calculation from Calculation History, then use View → Export to create a new version.");
    navigate("/calculation-history");
  };

  // Mock data for demo
  const versions = [
    {
      id: "v3",
      versionNumber: 3,
      calculationType: "Occupant Load",
      inputData: { occupancy: "D", area: 1000 },
      resultData: { load: 150, perPerson: 6.67 },
      changeReason: "Updated area measurement",
      changedBy: "Jose Acevedo",
      changedAt: "2026-03-01T10:30:00Z",
      parentVersionId: "v2",
    },
    {
      id: "v2",
      versionNumber: 2,
      calculationType: "Occupant Load",
      inputData: { occupancy: "D", area: 900 },
      resultData: { load: 135, perPerson: 6.67 },
      changeReason: "Initial calculation",
      changedBy: "Jose Acevedo",
      changedAt: "2026-02-28T14:15:00Z",
      parentVersionId: "v1",
    },
    {
      id: "v1",
      versionNumber: 1,
      calculationType: "Occupant Load",
      inputData: { occupancy: "D", area: 800 },
      resultData: { load: 120, perPerson: 6.67 },
      changeReason: "Initial calculation",
      changedBy: "Jose Acevedo",
      changedAt: "2026-02-27T09:00:00Z",
      parentVersionId: null,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calculation Versions</h1>
        <p className="text-muted-foreground mt-1">Track and manage calculation iterations with full audit trail</p>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="comparison">Version Comparison</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calculation History</CardTitle>
              <CardDescription>All versions of this calculation with change tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id}>
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVersion === version.id
                          ? "bg-primary/10 border-primary"
                          : "bg-card hover:bg-accent"
                      }`}
                      onClick={() => setSelectedVersion(version.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">v{version.versionNumber}</Badge>
                            <span className="font-semibold">{version.calculationType}</span>
                            <Badge variant="secondary">{version.changeReason}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Changed by {version.changedBy} on {formatDate(version.changedAt)}
                          </p>
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">
                              Result: <span className="font-mono font-semibold">{JSON.stringify(version.resultData)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVersion(version.id)}
                            title="Select version"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(version.resultData));
                              toast.success(`v${version.versionNumber} result copied`);
                            }}
                            title="Copy result"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Version chain indicator */}
                    {index < versions.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Versions</CardTitle>
              <CardDescription>Side-by-side comparison of calculation versions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Version 3 (Latest)</h3>
                    <div className="bg-card p-4 rounded-lg space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Occupancy</p>
                        <p className="font-mono font-semibold">D</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area (sq ft)</p>
                        <p className="font-mono font-semibold">1000</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-muted-foreground">Occupant Load</p>
                        <p className="font-mono font-semibold text-green-700">150</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Version 2</h3>
                    <div className="bg-card p-4 rounded-lg space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Occupancy</p>
                        <p className="font-mono font-semibold">D</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Area (sq ft)</p>
                        <p className="font-mono font-semibold">900</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="text-muted-foreground">Occupant Load</p>
                        <p className="font-mono font-semibold text-yellow-700">135</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Change:</strong> Area increased from 900 to 1000 sq ft, resulting in +15 occupants
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete history of all changes with timestamps and signatures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Change Reason</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Signature</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">v{version.versionNumber}</TableCell>
                        <TableCell>{version.changeReason}</TableCell>
                        <TableCell>{version.changedBy}</TableCell>
                        <TableCell className="text-sm">{formatDate(version.changedAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {version.id.substring(0, 8)}...
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recalculation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Recalculate</CardTitle>
          <CardDescription>Create a new version with updated inputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use the recalculation feature to update inputs and create a new version while preserving the complete audit trail.
          </p>
          <Button className="gap-2" onClick={handleCreateNewVersion}>
            <RotateCcw className="w-4 h-4" />
            Create New Version
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
