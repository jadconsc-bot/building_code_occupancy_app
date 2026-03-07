/**
 * Scenario Comparison Component
 * 
 * Allows engineers to compare multiple "what-if" scenarios
 * Shows side-by-side results with differences highlighted
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, Copy } from 'lucide-react';

export interface Scenario {
  id: string;
  name: string;
  occupancy: string;
  area_m2: number;
  storeys: number;
  construction_type: string;
  sprinklers: boolean;
  results?: Record<string, any>;
}

interface ScenarioComparisonProps {
  onCalculate?: (scenario: Scenario) => Promise<void>;
  onExport?: (scenarios: Scenario[]) => void;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  onCalculate,
  onExport,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: '1',
      name: 'Base Case',
      occupancy: 'D',
      area_m2: 5000,
      storeys: 2,
      construction_type: 'Non-Combustible',
      sprinklers: false,
    },
  ]);

  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set(['1']));
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add new scenario
  const addScenario = () => {
    const newId = String(Math.max(...scenarios.map(s => parseInt(s.id)), 0) + 1);
    const lastScenario = scenarios[scenarios.length - 1];
    
    setScenarios([
      ...scenarios,
      {
        id: newId,
        name: `Scenario ${newId}`,
        occupancy: lastScenario.occupancy,
        area_m2: lastScenario.area_m2,
        storeys: lastScenario.storeys,
        construction_type: lastScenario.construction_type,
        sprinklers: lastScenario.sprinklers,
      },
    ]);
  };

  // Delete scenario
  const deleteScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
    selectedScenarios.delete(id);
    setSelectedScenarios(new Set(selectedScenarios));
  };

  // Update scenario
  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    setScenarios(scenarios.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Duplicate scenario
  const duplicateScenario = (id: string) => {
    const scenario = scenarios.find(s => s.id === id);
    if (!scenario) return;

    const newId = String(Math.max(...scenarios.map(s => parseInt(s.id)), 0) + 1);
    setScenarios([
      ...scenarios,
      {
        ...scenario,
        id: newId,
        name: `${scenario.name} (Copy)`,
      },
    ]);
  };

  // Calculate selected scenarios
  const calculateScenarios = async () => {
    for (const scenario of scenarios) {
      if (selectedScenarios.has(scenario.id) && onCalculate) {
        try {
          await onCalculate(scenario);
        } catch (error) {
          console.error(`Failed to calculate scenario ${scenario.id}:`, error);
        }
      }
    }
  };

  // Get comparison data
  const comparisonData = useMemo(() => {
    const selected = scenarios.filter(s => selectedScenarios.has(s.id));
    
    if (selected.length === 0) return null;

    // Find differences
    const differences: Record<string, any[]> = {};
    const keys = ['occupancy', 'area_m2', 'storeys', 'construction_type', 'sprinklers'];

    keys.forEach(key => {
      const values = selected.map(s => s[key as keyof Scenario]);
      const unique = new Set(values.map(v => JSON.stringify(v)));
      if (unique.size > 1) {
        differences[key] = values;
      }
    });

    return { selected, differences };
  }, [scenarios, selectedScenarios]);

  const handleSelectScenario = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedScenarios);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedScenarios(newSelected);
  };

  return (
    <div className="w-full space-y-6">
      {/* Scenario List */}
      <Card>
        <CardHeader>
          <CardTitle>Scenarios</CardTitle>
          <CardDescription>Create and manage building scenarios for comparison</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={selectedScenarios.has(scenario.id)}
                    onCheckedChange={(checked) =>
                      handleSelectScenario(scenario.id, checked as boolean)
                    }
                  />
                  <Input
                    value={scenario.name}
                    onChange={(e) =>
                      updateScenario(scenario.id, { name: e.target.value })
                    }
                    className="font-semibold"
                    placeholder="Scenario name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateScenario(scenario.id)}
                    title="Duplicate scenario"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteScenario(scenario.id)}
                    disabled={scenarios.length === 1}
                    title="Delete scenario"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Scenario Parameters */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Occupancy</Label>
                  <Select
                    value={scenario.occupancy}
                    onValueChange={(value) =>
                      updateScenario(scenario.id, { occupancy: value })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Assembly (A)</SelectItem>
                      <SelectItem value="B">Institutional (B)</SelectItem>
                      <SelectItem value="C">Residential (C)</SelectItem>
                      <SelectItem value="D">Office/Business (D)</SelectItem>
                      <SelectItem value="E">Educational (E)</SelectItem>
                      <SelectItem value="F-1">Factory Low Hazard (F-1)</SelectItem>
                      <SelectItem value="F-2">Factory Medium Hazard (F-2)</SelectItem>
                      <SelectItem value="F-3">Factory High Hazard (F-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Area (m²)</Label>
                  <Input
                    type="number"
                    value={scenario.area_m2}
                    onChange={(e) =>
                      updateScenario(scenario.id, {
                        area_m2: parseInt(e.target.value) || 0,
                      })
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Storeys</Label>
                  <Input
                    type="number"
                    value={scenario.storeys}
                    onChange={(e) =>
                      updateScenario(scenario.id, {
                        storeys: parseInt(e.target.value) || 1,
                      })
                    }
                    className="text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs">Construction Type</Label>
                  <Select
                    value={scenario.construction_type}
                    onValueChange={(value) =>
                      updateScenario(scenario.id, { construction_type: value })
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non-Combustible">Non-Combustible</SelectItem>
                      <SelectItem value="Combustible">Combustible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={scenario.sprinklers}
                      onCheckedChange={(checked) =>
                        updateScenario(scenario.id, {
                          sprinklers: checked as boolean,
                        })
                      }
                    />
                    <Label className="text-xs cursor-pointer">Sprinklers</Label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            onClick={addScenario}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Scenario
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {comparisonData && (
        <Card>
          <CardHeader>
            <CardTitle>Comparison</CardTitle>
            <CardDescription>
              {comparisonData.selected.length} scenario(s) selected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter</TableHead>
                    {comparisonData.selected.map((scenario) => (
                      <TableHead key={scenario.id} className="text-center">
                        {scenario.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold">Occupancy</TableCell>
                    {comparisonData.selected.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <Badge
                          variant={
                            comparisonData.differences.occupancy
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {scenario.occupancy}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-semibold">Area (m²)</TableCell>
                    {comparisonData.selected.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <Badge
                          variant={
                            comparisonData.differences.area_m2
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {scenario.area_m2.toLocaleString()}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-semibold">Storeys</TableCell>
                    {comparisonData.selected.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <Badge
                          variant={
                            comparisonData.differences.storeys
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {scenario.storeys}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-semibold">Construction</TableCell>
                    {comparisonData.selected.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <Badge
                          variant={
                            comparisonData.differences.construction_type
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {scenario.construction_type}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell className="font-semibold">Sprinklers</TableCell>
                    {comparisonData.selected.map((scenario) => (
                      <TableCell key={scenario.id} className="text-center">
                        <Badge
                          variant={
                            comparisonData.differences.sprinklers
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {scenario.sprinklers ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={calculateScenarios}
                className="flex-1"
              >
                Calculate Selected
              </Button>
              {onExport && (
                <Button
                  onClick={() => onExport(comparisonData.selected)}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
