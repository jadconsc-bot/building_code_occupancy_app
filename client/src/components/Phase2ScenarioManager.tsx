/**
 * Phase 2 Scenario Manager Component
 * 
 * Provides UI for:
 * - Creating and saving scenarios
 * - Viewing scenario history
 * - Comparing multiple scenarios
 * - Managing scenario versions
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, History, Trash2, Eye, Copy } from "lucide-react";
import { toast } from "sonner";

interface ScenarioManagerProps {
  projectId?: number;
  onScenarioSaved?: (scenarioId: number) => void;
}

export function Phase2ScenarioManager({ projectId, onScenarioSaved }: ScenarioManagerProps) {
  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [scenarioType, setScenarioType] = useState<"fire_resistance" | "compliance" | "custom">("compliance");
  const [inputData, setInputData] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyScenarioId, setHistoryScenarioId] = useState<number | null>(null);

  // Queries
  const { data: scenarios, isLoading: scenariosLoading, refetch: refetchScenarios } = trpc.phase2.getScenarios.useQuery();
  const { data: projectScenarios } = trpc.phase2.getProjectScenarios.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );
  const { data: scenarioHistory } = trpc.phase2.getScenarioHistory.useQuery(
    { scenarioId: historyScenarioId || 0 },
    { enabled: !!historyScenarioId }
  );

  // Mutations
  const saveScenarioMutation = trpc.phase2.saveScenario.useMutation({
    onSuccess: (data) => {
      toast.success("Scenario saved successfully");
      setScenarioName("");
      setScenarioDescription("");
      setInputData("");
      setIsOpen(false);
      refetchScenarios();
      onScenarioSaved?.(data.id);
    },
    onError: (error) => {
      toast.error(`Failed to save scenario: ${error.message}`);
    },
  });

  const deleteScenarioMutation = trpc.phase2.deleteScenario.useMutation({
    onSuccess: () => {
      toast.success("Scenario deleted successfully");
      refetchScenarios();
    },
    onError: (error) => {
      toast.error(`Failed to delete scenario: ${error.message}`);
    },
  });

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error("Scenario name is required");
      return;
    }

    try {
      const data = inputData ? JSON.parse(inputData) : {};
      saveScenarioMutation.mutate({
        projectId,
        name: scenarioName,
        description: scenarioDescription,
        type: scenarioType,
        inputData: data,
      });
    } catch (error) {
      toast.error("Invalid JSON input data");
    }
  };

  const handleDeleteScenario = (scenarioId: number) => {
    if (confirm("Are you sure you want to delete this scenario?")) {
      deleteScenarioMutation.mutate({ scenarioId });
    }
  };

  const displayScenarios = projectId ? projectScenarios : scenarios;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "calculated":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Scenario Management</CardTitle>
          <CardDescription>Create and manage what-if scenarios with version history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create New Scenario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Scenario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Scenario Name</label>
                  <Input
                    placeholder="e.g., Fire Resistance Test A"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Optional description of this scenario"
                    value={scenarioDescription}
                    onChange={(e) => setScenarioDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Scenario Type</label>
                  <Select value={scenarioType} onValueChange={(value: any) => setScenarioType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fire_resistance">Fire Resistance</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Input Data (JSON)</label>
                  <Textarea
                    placeholder='{"occupancy": "Residential", "area_m2": 2500}'
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSaveScenario}
                  disabled={saveScenarioMutation.isPending}
                  className="w-full"
                >
                  {saveScenarioMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Scenario
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Scenarios List */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Saved Scenarios ({displayScenarios?.length || 0})</h3>
            {scenariosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : displayScenarios && displayScenarios.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayScenarios.map((scenario: any) => (
                  <Card key={scenario.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Checkbox
                            checked={selectedForComparison.includes(scenario.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedForComparison([...selectedForComparison, scenario.id]);
                              } else {
                                setSelectedForComparison(selectedForComparison.filter((id) => id !== scenario.id));
                              }
                            }}
                          />
                          <p className="font-medium text-sm">{scenario.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {scenario.type}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(scenario.status)}`}>
                            {scenario.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            v{scenario.version}
                          </Badge>
                        </div>
                        {scenario.description && (
                          <p className="text-xs text-muted-foreground mb-1">{scenario.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(scenario.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setHistoryScenarioId(scenario.id);
                            setShowHistory(true);
                          }}
                        >
                          <History className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedScenario(scenario)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteScenario(scenario.id)}
                          disabled={deleteScenarioMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No scenarios created yet</p>
            )}
          </div>

          {/* Comparison Button */}
          {selectedForComparison.length > 1 && (
            <Button variant="outline" className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Compare {selectedForComparison.length} Scenarios
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Scenario Viewer */}
      {selectedScenario && (
        <Dialog open={!!selectedScenario} onOpenChange={() => setSelectedScenario(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedScenario.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  Type: {selectedScenario.type} | Status: {selectedScenario.status} | Version: {selectedScenario.version}
                </p>
                {selectedScenario.description && (
                  <p className="text-sm text-muted-foreground mb-2">{selectedScenario.description}</p>
                )}
                <p className="text-sm text-muted-foreground mb-2">
                  Created: {new Date(selectedScenario.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-xs font-medium mb-2">Input Data:</p>
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedScenario.inputData, null, 2)}
                </pre>
                {selectedScenario.resultData && (
                  <>
                    <p className="text-xs font-medium mt-4 mb-2">Result Data:</p>
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedScenario.resultData, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* History Viewer */}
      {showHistory && scenarioHistory && (
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Scenario Version History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {scenarioHistory.length > 0 ? (
                scenarioHistory.map((entry: any) => (
                  <Card key={entry.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Version {entry.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Changed by: {entry.userId}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No version history available</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
