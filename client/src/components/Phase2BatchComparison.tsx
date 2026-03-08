/**
 * Phase 2 Batch Comparison Component
 * 
 * Provides UI for:
 * - Creating batch comparisons
 * - Comparing multiple scenarios
 * - Viewing comparison results
 * - Exporting comparison data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Eye, Download } from "lucide-react";
import { toast } from "sonner";

interface BatchComparisonProps {
  projectId?: number;
  scenarioIds?: number[];
  onComparisonCreated?: (batchId: number) => void;
}

export function Phase2BatchComparison({ projectId, scenarioIds = [], onComparisonCreated }: BatchComparisonProps) {
  const [batchName, setBatchName] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [selectedScenarios, setSelectedScenarios] = useState<number[]>(scenarioIds);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  // Queries
  const { data: batches, isLoading: batchesLoading, refetch: refetchBatches } = trpc.phase2.getBatchComparisons.useQuery();
  const { data: projectBatches } = trpc.phase2.getProjectBatchComparisons.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );
  const { data: scenarios } = trpc.phase2.getScenarios.useQuery();

  // Mutations
  const saveBatchMutation = trpc.phase2.saveBatchComparison.useMutation({
    onSuccess: (data) => {
      toast.success("Batch comparison created successfully");
      setBatchName("");
      setBatchDescription("");
      setSelectedScenarios([]);
      setIsOpen(false);
      refetchBatches();
      onComparisonCreated?.(data.id);
    },
    onError: (error) => {
      toast.error(`Failed to create batch: ${error.message}`);
    },
  });

  const compareMutation = trpc.phase2.compareBatchScenarios.useMutation({
    onSuccess: (data) => {
      toast.success("Comparison completed successfully");
      setComparisonResult(data);
    },
    onError: (error) => {
      toast.error(`Failed to compare scenarios: ${error.message}`);
    },
  });

  const deleteBatchMutation = trpc.phase2.deleteBatchComparison.useMutation({
    onSuccess: () => {
      toast.success("Batch comparison deleted successfully");
      refetchBatches();
    },
    onError: (error) => {
      toast.error(`Failed to delete batch: ${error.message}`);
    },
  });

  const handleCreateBatch = () => {
    if (!batchName.trim()) {
      toast.error("Batch name is required");
      return;
    }

    if (selectedScenarios.length < 2) {
      toast.error("Select at least 2 scenarios to compare");
      return;
    }

    saveBatchMutation.mutate({
      projectId,
      name: batchName,
      description: batchDescription,
      scenarioIds: selectedScenarios,
    });
  };

  const handleRunComparison = (batchId: number) => {
    const batch = displayBatches?.find((b) => b.id === batchId);
    if (batch && batch.scenarioIds && Array.isArray(batch.scenarioIds) && batch.scenarioIds.length > 0) {
      compareMutation.mutate({
        batchId,
        scenarioIds: batch.scenarioIds as number[],
      });
    }
  };

  const handleDeleteBatch = (batchId: number) => {
    if (confirm("Are you sure you want to delete this batch comparison?")) {
      deleteBatchMutation.mutate({ batchId });
    }
  };

  const displayBatches = projectId ? projectBatches : batches;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Batch Comparisons</CardTitle>
          <CardDescription>Compare multiple scenarios simultaneously</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Batch Comparison
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Batch Comparison</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Batch Name</label>
                  <Input
                    placeholder="e.g., Construction Type Comparison"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Optional description of this comparison"
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Select Scenarios (minimum 2)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {scenarios && Array.isArray(scenarios) && scenarios.length > 0 ? (
                      scenarios.map((scenario: any) => (
                        <div key={scenario.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedScenarios.includes(scenario.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedScenarios([...selectedScenarios, scenario.id]);
                              } else {
                                setSelectedScenarios(selectedScenarios.filter((id) => id !== scenario.id));
                              }
                            }}
                          />
                          <label className="text-sm cursor-pointer flex-1">
                            {scenario.name}
                            <span className="text-xs text-muted-foreground ml-1">({scenario.type})</span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No scenarios available</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedScenarios?.length || 0} scenarios
                  </p>
                </div>

                <Button
                  onClick={handleCreateBatch}
                  disabled={saveBatchMutation.isPending || selectedScenarios.length < 2}
                  className="w-full"
                >
                  {saveBatchMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Batch
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Batches List */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Batch Comparisons ({displayBatches?.length || 0})</h3>
            {batchesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : displayBatches && displayBatches.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayBatches.map((batch: any) => (
                  <Card key={batch.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{batch.name}</p>
                          <Badge className={`text-xs ${getStatusColor(batch.status)}`}>
                            {batch.status}
                          </Badge>
                        </div>
                        {batch.description && (
                          <p className="text-xs text-muted-foreground mb-1">{batch.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {batch.scenarioIds?.length || 0} scenarios | {new Date(batch.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRunComparison(batch.id)}
                          disabled={compareMutation.isPending}
                        >
                          {compareMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Run"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBatch(batch)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBatch(batch.id)}
                          disabled={deleteBatchMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No batch comparisons created yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Viewer */}
      {selectedBatch && (
        <Dialog open={!!selectedBatch} onOpenChange={() => setSelectedBatch(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedBatch.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Status: {selectedBatch.status}</p>
                {selectedBatch.description && (
                  <p className="text-sm text-muted-foreground mb-2">{selectedBatch.description}</p>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  Scenarios: {selectedBatch.scenarioIds?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  Created: {new Date(selectedBatch.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedBatch.comparisonData && (
                <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                  <p className="text-xs font-medium mb-2">Comparison Results:</p>
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(selectedBatch.comparisonData, null, 2)}
                  </pre>
                </div>
              )}

              {comparisonResult && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">Latest Comparison Results</p>
                  <pre className="text-xs whitespace-pre-wrap break-words text-green-800">
                    {JSON.stringify(comparisonResult, null, 2)}
                  </pre>
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(comparisonResult, null, 2));
                      toast.success("Comparison results copied to clipboard");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Copy Results
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
