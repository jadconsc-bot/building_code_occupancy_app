/**
 * Compliance Page
 * Main interface for compliance analysis and governance
 */

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ComplianceAnalyzer } from "@/components/ComplianceAnalyzer";
import { ComplianceSnapshotViewer } from "@/components/ComplianceSnapshotViewer";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Shield, Settings } from "lucide-react";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { CompliancePathwayReport, type CompliancePathwayReportProps } from "@/components/CompliancePathwayReport";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

export default function CompliancePage() {
  const params = useParams();
  const projectId = params.projectId ? parseInt(params.projectId) : 0;
  const { user } = useAuth();
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [pathway, setPathway] = useState<Partial<CompliancePathwayReportProps> | null>(null);
  const [scenarioResults, setScenarioResults] = useState<Record<string, any>>({});
  const [savedInputs, setSavedInputs] = useState<any>(null);

  useEffect(() => {
    setComplianceResult(null);
    setPathway(null);
    setSavedInputs(null);
  }, [projectId]);

  const pathwayMutation = trpc.compliancePathway.generatePathway.useMutation({
    onSuccess: (data) => {
      setPathway(data);
    },
  });

  const analyzeComplianceMutation = trpc.compliance.analyzeCompliance.useMutation();
  const { data: rulesets } = trpc.compliance.getRulesets.useQuery();
  const { data: project } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );
  const govSnapshots = trpc.compliance.getProjectSnapshots.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const handleGeneratePathway = async () => {
    if (!complianceResult) return;
    await pathwayMutation.mutateAsync({
      complianceResult,
      inputs: {
        occupancy_major: complianceResult.inputs?.occupancy_major ?? 'D',
        area_m2: complianceResult.inputs?.area_m2 ?? 0,
      },
    });
  };

  const handleScenarioCalculate = async (scenario: any) => {
    const rulesetId = rulesets?.[0]?.rulesetId ?? '';
    if (!rulesetId) return;
    const result = await analyzeComplianceMutation.mutateAsync({
      projectId,
      rulesetId,
      mode: scenario.mode ?? 'soft',
      inputs: scenario.inputs ?? {
        occupancy_major: scenario.occupancy,
        area_m2: scenario.area_m2,
        storeys: scenario.storeys,
        construction_type: scenario.construction_type,
        sprinklers: scenario.sprinklers,
      },
    });
    setScenarioResults(prev => ({ ...prev, [scenario.id]: result }));
  };

  const [, navigate] = useLocation();

  if (!projectId) {
    return (
      <div className="p-6">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <CardTitle>No Project Selected</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 mb-4">
              Please select or create a project to use the compliance analysis engine.
            </p>
            <Button onClick={() => navigate("/project-checklists")} variant="outline">
              Go to Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mostRecentSnap = [...(govSnapshots.data ?? [])].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  )[0];

  const activeRuleset =
    rulesets?.find(r => r.rulesetId === mostRecentSnap?.rulesetId) ?? rulesets?.[0];

  const analystName =
    (user as any)?.name ?? (user as any)?.email ?? (user as any)?.username ?? 'Authenticated User';

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Compliance Engine</h1>
        </div>
        <p className="text-gray-600">
          Deterministic code compliance analysis with full rule traceability and immutable snapshots
        </p>
      </div>

      {/* Legal Disclaimer */}
      <LegalDisclaimer />

      {/* Main Content */}
      <div className="mt-6">
        <Tabs defaultValue="analyzer" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analyzer">Analysis</TabsTrigger>
            <TabsTrigger value="scenarios">What-If Scenarios</TabsTrigger>
            <TabsTrigger value="pathway">Code Pathway</TabsTrigger>
            <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
          </TabsList>

          {/* Analysis tab */}
          <TabsContent value="analyzer" className="space-y-6 mt-6">
            <ComplianceAnalyzer
              projectId={projectId}
              initialOccupancy={project?.occupancyCode ?? undefined}
              initialProvince={project?.province ?? undefined}
              initialBuildingType={project?.buildingType ?? undefined}
              persistedInputs={savedInputs}
              onInputsChange={(inputs) => setSavedInputs(inputs)}
              onResult={(result) => { setComplianceResult(result); setPathway(null); }}
            />
          </TabsContent>

          {/* What-If Scenarios tab */}
          <TabsContent value="scenarios" className="space-y-6 mt-6">
            <ScenarioComparison
              projectId={projectId}
              onCalculate={handleScenarioCalculate}
              results={scenarioResults}
              initialScenario={(() => {
                const src = complianceResult?.inputs ?? mostRecentSnap?.inputs;
                if (!src) return undefined;
                const legacyMap: Record<string, string> = {
                  residential: 'C', commercial: 'D', assembly: 'A',
                  institutional: 'B', industrial: 'F',
                };
                const rawOcc = src.occupancy_major ?? 'D';
                return {
                  occupancy: legacyMap[rawOcc] ?? rawOcc,
                  area_m2: src.area_m2 ?? 0,
                  storeys: src.storeys ?? 1,
                  construction_type: src.construction_type ?? 'combustible',
                  sprinklers: src.sprinklers ?? false,
                };
              })()}
            />
          </TabsContent>

          {/* Code Pathway tab */}
          <TabsContent value="pathway" className="space-y-6 mt-6">
            {!complianceResult && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm text-yellow-700">
                    Run a compliance analysis on the Analysis tab first, then generate a pathway here.
                  </p>
                </CardContent>
              </Card>
            )}
            <Button
              onClick={handleGeneratePathway}
              disabled={!complianceResult || pathwayMutation.isPending}
            >
              {pathwayMutation.isPending ? 'Generating...' : 'Generate Code Pathway'}
            </Button>
            {pathway && <CompliancePathwayReport {...pathway} />}
            {!pathway && complianceResult && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600">
                    Click "Generate Code Pathway" to see compliance requirements
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Snapshots tab */}
          <TabsContent value="snapshots" className="space-y-6 mt-6">
            <ComplianceSnapshotViewer projectId={projectId} />
          </TabsContent>

          {/* Governance tab */}
          <TabsContent value="governance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Governance & Audit</CardTitle>
                <CardDescription>Rule management, changelog, and audit logs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Active Rulesets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{rulesets?.length ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activeRuleset ? `${activeRuleset.code} ${activeRuleset.edition}` : 'No rulesets'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Rule Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-gray-500 mt-1">Changelog coming soon</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Audit Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{govSnapshots.data?.length ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-1">Compliance snapshots</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Most recent snapshot */}
                {mostRecentSnap && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Most Recent Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Analyst:</span>
                        <span className="font-medium">{analystName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Analysis Date:</span>
                        <span className="font-medium">
                          {mostRecentSnap.createdAt
                            ? new Date(mostRecentSnap.createdAt).toLocaleString()
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signature:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {mostRecentSnap.snapshotId?.slice(0, 16) ?? '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rule Engine:</span>
                        <span className="font-medium">
                          {rulesets?.find(r => r.rulesetId === mostRecentSnap.rulesetId)?.version ??
                            mostRecentSnap.rulesetId ??
                            '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Code Edition:</span>
                        <span className="font-medium">{mostRecentSnap.rulesetId ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Immutability:</span>
                        <Badge className="bg-green-100 text-green-800">Immutable</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!mostRecentSnap && !govSnapshots.isLoading && (
                  <Card className="bg-gray-50">
                    <CardContent className="pt-6 pb-6">
                      <p className="text-sm text-gray-500 text-center">
                        No analyses yet. Run a compliance analysis to see governance data.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Rule management stub */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Rule Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Rule DSL editor and governance dashboard coming in next phase. This will allow admins to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-3 space-y-1">
                      <li>Create and edit rules using a domain-specific language</li>
                      <li>Version rulesets tied to code editions</li>
                      <li>Track all rule changes with approval workflows</li>
                      <li>Run comprehensive test suites for validation</li>
                      <li>View complete audit logs of all analyses</li>
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
