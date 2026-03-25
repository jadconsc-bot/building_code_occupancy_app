/**
 * Compliance Page
 * Main interface for compliance analysis and governance
 */

import { useState } from "react";
import { useParams } from "wouter";
import { ComplianceAnalyzer } from "@/components/ComplianceAnalyzer";
import { ComplianceSnapshotViewer } from "@/components/ComplianceSnapshotViewer";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Shield, FileText, Settings } from "lucide-react";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { CompliancePathwayReport } from "@/components/CompliancePathwayReport";
import { AuditTrailViewer } from "@/components/AuditTrailViewer";
import { SignaturePad } from "@/components/SignaturePad";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CompliancePage() {
  const params = useParams();
  const projectId = params.projectId ? parseInt(params.projectId) : 0;
  const [complianceResult, setComplianceResult] = useState<any>(null);
  const [pathway, setPathway] = useState<any>(null);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState({
    name: 'My Project',
    engineer: 'John Smith',
  });
  const [projectName, setProjectName] = useState('My Project');
  const [engineerName, setEngineerName] = useState('John Smith');
  const [engineerEmail, setEngineerEmail] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  // Decision 3: Submit for professional review
  const submitForReviewMutation = trpc.compliance.submitForReview.useMutation({
    onSuccess: () => {
      setShowSignaturePad(true);
    },
  });

  // Decision 3: Sign review with digital signature
  const signReviewMutation = trpc.compliance.signReview.useMutation({
    onSuccess: () => {
      setShowSignaturePad(false);
    },
  });

  const pathwayMutation = trpc.compliancePathway.generatePathway.useMutation({
    onSuccess: (data) => {
      setPathway(data);
    },
  });

  const handleGeneratePathway = async () => {
    if (!complianceResult) {
      toast.error('Run compliance analysis first');
      return;
    }

    await pathwayMutation.mutateAsync({
      complianceResult,
      inputs: {
        occupancy_major: 'D',
        area_m2: 5000,
      },
    });
  };

  const handleCreateAudit = async () => {
    if (!complianceResult) {
      toast.error('Run compliance analysis first');
      return;
    }

    try {
      // Submit for professional review (Decision 3)
      await submitForReviewMutation.mutateAsync({
        snapshotId: complianceResult.snapshotId || 'snapshot-' + Date.now(),
        projectId,
        notes: `Compliance analysis for ${projectName}`,
      });
    } catch (error) {
      toast.error('Failed to create audit trail');
    }
  };

  const handleSignatureComplete = async (signatureData: string) => {
    if (!complianceResult) {
      toast.error('No compliance result to sign');
      return;
    }

    try {
      // Sign review with digital signature (Decision 3)
      await signReviewMutation.mutateAsync({
        snapshotId: complianceResult.snapshotId || 'snapshot-' + Date.now(),
        signature: signatureData,
        signerRole: 'engineer',
        licenseNumber: licenseNumber || undefined,
      });
    } catch (error) {
      toast.error('Failed to sign review');
    }
  };

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
            <p className="text-sm text-gray-700">
              Please select or create a project to use the compliance analysis engine.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="analyzer">Analysis</TabsTrigger>
          <TabsTrigger value="scenarios">What-If Scenarios</TabsTrigger>
          <TabsTrigger value="pathway">Code Pathway</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="analyzer" className="space-y-6 mt-6">
          <ComplianceAnalyzer 
            projectId={projectId}
            onResultsChange={(results) => setComplianceResult(results)}
          />
          <Button onClick={handleGeneratePathway} disabled={pathwayMutation.isPending || !complianceResult}>
            {pathwayMutation.isPending ? 'Generating...' : 'Generate Code Pathway'}
          </Button>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6 mt-6">
          <ScenarioComparison />
        </TabsContent>

        <TabsContent value="pathway" className="space-y-6 mt-6">
          {pathway && (
            <CompliancePathwayReport
              projectSummary={{
                occupancy: 'D',
                area_m2: 5000,
                storeys: 1,
                constructionType: 'Wood Frame',
                sprinklers: false,
              }}
              justificationNarrative={pathway?.narrative || 'Compliance pathway generated'}
              complianceSummary={pathway?.summary || 'See details below'}
            />
          )}
          {!pathway && (
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Generate a code pathway to see compliance requirements</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-6 mt-6">
          <div className="space-y-4">
            {/* Engineer info section */}
            <Card>
              <CardHeader>
                <CardTitle>Engineer Information</CardTitle>
                <CardDescription>Required for audit trail creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="engineerName">Engineer Name</Label>
                  <Input
                    id="engineerName"
                    value={engineerName}
                    onChange={(e) => setEngineerName(e.target.value)}
                    placeholder="Enter engineer name"
                  />
                </div>
                <div>
                  <Label htmlFor="engineerEmail">Email</Label>
                  <Input
                    id="engineerEmail"
                    value={engineerEmail}
                    onChange={(e) => setEngineerEmail(e.target.value)}
                    type="email"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="licenseNumber">Professional License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Enter license number"
                  />
                </div>
                <Button
                  onClick={handleCreateAudit}
                  disabled={!complianceResult || submitForReviewMutation.isPending}
                  className="w-full"
                >
                  Create Audit Trail
                </Button>
              </CardContent>
            </Card>

            {/* Audit viewer */}
            {auditId && (
              <div className="space-y-4">
                <AuditTrailViewer projectId={projectId} />
              </div>
            )}

            {/* Signature Pad - shown after submitting for review */}
            {showSignaturePad && (
              <SignaturePad
                engineerName={engineerName}
                onSignatureComplete={handleSignatureComplete}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-6 mt-6">
          <ComplianceSnapshotViewer projectId={projectId} />
        </TabsContent>

        <TabsContent value="governance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Governance & Audit</CardTitle>
              <CardDescription>Rule management, changelog, and audit logs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Rulesets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Rule Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Audit Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">—</p>
                    <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                  </CardContent>
                </Card>
              </div>

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
