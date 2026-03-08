import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle2, AlertCircle, Clock, FileDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { auditRecordsToCSV, downloadCSV } from '@/lib/csvExport';

interface AuditTrailViewerProps {
  projectId: number;
}

export function AuditTrailViewer({ projectId }: AuditTrailViewerProps) {
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  // Fetch all audits for project
  const { data: auditData, isLoading } = trpc.audit.getProjectAudits.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  // Verify integrity of selected audit
  const { data: integrityData } = trpc.audit.verifyAuditIntegrity.useQuery(
    { auditId: selectedAuditId || '' },
    { enabled: !!selectedAuditId }
  );

  // Generate defense report
  const { data: reportData } = trpc.audit.generateDefenseReport.useQuery(
    { auditId: selectedAuditId || '' },
    { enabled: !!selectedAuditId }
  );

  const audits = auditData?.audits || [];
  const selectedAudit = audits.find((a: any) => a.id === selectedAuditId);

  const handleDownloadReport = () => {
    if (!reportData?.report) return;

    const element = document.createElement('a');
    const file = new Blob([reportData.report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = reportData.filename || 'audit-report.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadCSV = () => {
    if (audits.length === 0) return;

    // Convert audits to CSV format
    const csvContent = auditRecordsToCSV(
      audits.map((audit: any) => ({
        id: audit.id,
        projectId: String(audit.projectId),
        action: 'COMPLIANCE_ANALYSIS',
        timestamp: audit.timestamp,
        engineerName: audit.engineerName,
        engineerEmail: audit.engineerEmail || '',
        licenseNumber: audit.engineerLicense || '',
        details: {
          occupancy: audit.occupancy,
          codeVersion: audit.codeVersion,
          compliancePercentage: audit.compliancePercentage,
          overallStatus: audit.overallStatus,
          totalRulesEvaluated: audit.totalRulesEvaluated,
          totalRulesPassed: audit.totalRulesPassed,
          totalRulesFailed: audit.totalRulesFailed
        },
        hash: audit.hash,
        verified: audit.status === 'SIGNED'
      }))
    );

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-trail-${timestamp}.csv`;
    downloadCSV(csvContent, filename);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading audit history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (audits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No audit logs yet. Run a compliance check to create an audit trail.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Audit Trail</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{audits.length} audits</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadCSV}
              disabled={audits.length === 0}
              title="Download audit trail as CSV"
            >
              <FileDown className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedAuditId}>
              Details
            </TabsTrigger>
            <TabsTrigger value="report" disabled={!selectedAuditId}>
              Report
            </TabsTrigger>
          </TabsList>

          {/* Audit History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="space-y-2">
              {audits.map((audit: any) => (
                <div
                  key={audit.id}
                  onClick={() => setSelectedAuditId(audit.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAuditId === audit.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{audit.projectName}</h4>
                        <Badge
                          variant={
                            audit.overallStatus === 'COMPLIANT'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {audit.overallStatus}
                        </Badge>
                        {audit.status === 'SIGNED' && (
                          <Badge variant="outline" className="bg-green-50">
                            ✓ Signed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {audit.engineerName} • {new Date(audit.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-2">
                        Rules: {audit.totalRulesPassed}/{audit.totalRulesEvaluated} passed
                        ({Math.round(audit.compliancePercentage)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      {audit.status === 'SIGNED' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {selectedAudit && (
              <div className="space-y-4">
                {/* Verification Status */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {integrityData?.isValid ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700">Audit Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-red-700">Signature Invalid</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {integrityData?.isValid
                      ? 'This audit trail has not been tampered with.'
                      : 'Warning: This audit trail may have been modified.'}
                  </p>
                </div>

                {/* Audit Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Project</p>
                    <p className="font-medium">{selectedAudit.projectName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Engineer</p>
                    <p className="font-medium">{selectedAudit.engineerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">License</p>
                    <p className="font-medium">{selectedAudit.engineerLicense || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Code Version</p>
                    <p className="font-medium">{selectedAudit.codeVersion}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedAudit.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge
                      variant={
                        selectedAudit.overallStatus === 'COMPLIANT'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {selectedAudit.overallStatus}
                    </Badge>
                  </div>
                </div>

                {/* Compliance Summary */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Compliance Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Rules Evaluated</span>
                      <span className="font-medium">{selectedAudit.totalRulesEvaluated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rules Passed</span>
                      <span className="font-medium text-green-600">
                        {selectedAudit.totalRulesPassed}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rules Failed</span>
                      <span className="font-medium text-red-600">
                        {selectedAudit.totalRulesFailed}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Compliance Score</span>
                      <span className="font-bold text-lg">
                        {Math.round(selectedAudit.compliancePercentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assumptions & Limitations */}
                {selectedAudit.assumptions && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Assumptions</h4>
                    <ul className="text-sm space-y-1">
                      {JSON.parse(selectedAudit.assumptions).map((a: string, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          • {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAudit.limitations && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Limitations</h4>
                    <ul className="text-sm space-y-1">
                      {JSON.parse(selectedAudit.limitations).map((l: string, i: number) => (
                        <li key={i} className="text-muted-foreground">
                          • {l}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-4">
            {selectedAudit && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">
                    Download the professional compliance audit report for permit submission.
                  </p>
                  <Button
                    onClick={handleDownloadReport}
                    disabled={!reportData?.report}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Audit Report
                  </Button>
                </div>

                {reportData?.report && (
                  <div className="p-4 border rounded-lg bg-muted/50 max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {reportData.report}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
