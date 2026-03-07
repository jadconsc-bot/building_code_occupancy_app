import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Clock, Download, Shield, Edit3 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AuditTrailViewerProps {
  projectId: number;
}

export function AuditTrailViewer({ projectId }: AuditTrailViewerProps) {
  const [activeTab, setActiveTab] = useState("logs");

  // Fetch audit trail data
  const { data: auditData, isLoading, error } = trpc.audit.getAuditTrail.useQuery(
    { projectId, limit: 100 },
    { enabled: !!projectId }
  );

  // Export audit report mutation
  const { mutate: exportReport, isPending: isExporting } = trpc.audit.exportAuditReport.useQuery(
    { projectId },
    { enabled: false }
  ) as any;
  
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/trpc/audit.exportAuditReport?input=${JSON.stringify({ projectId })}`);
      const result = await response.json();
      const data = result.result?.data;
      
      if (data?.report) {
        const element = document.createElement("a");
        const file = new Blob([data.report], { type: "application/json" });
        element.href = URL.createObjectURL(file);
        element.download = `audit-report-${projectId}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error("Failed to export audit report:", error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "view":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "create":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "modify":
        return <Edit3 className="w-4 h-4 text-yellow-500" />;
      case "delete":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "export":
        return <Download className="w-4 h-4 text-purple-500" />;
      case "sign":
        return <Shield className="w-4 h-4 text-indigo-500" />;
      case "verify":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case "create":
        return "default";
      case "modify":
        return "secondary";
      case "delete":
        return "destructive";
      case "sign":
      case "verify":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading audit trail...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-destructive">Failed to load audit trail</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Audit Trail</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">
              Actions ({auditData?.auditLogs?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="signatures">
              Signatures ({auditData?.signatures?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="modifications">
              Changes ({auditData?.modifications?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Audit Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              {auditData?.auditLogs && auditData.auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditData.auditLogs.map((log: any) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                    >
                      <div className="mt-1">{getActionIcon(log.actionType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{log.action}</span>
                          <Badge variant={getActionBadgeVariant(log.actionType)} className="text-xs">
                            {log.actionType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                        {log.details && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {JSON.stringify(log.details).substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audit logs found
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Signatures Tab */}
          <TabsContent value="signatures" className="space-y-4">
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              {auditData?.signatures && auditData.signatures.length > 0 ? (
                <div className="space-y-3">
                  {auditData.signatures.map((sig: any) => (
                    <div
                      key={sig.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                    >
                      <Shield className="w-4 h-4 mt-1 text-indigo-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{sig.signatureType}</span>
                          <Badge
                            variant={
                              sig.verificationStatus === "verified" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {sig.verificationStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Signed: {new Date(sig.timestamp).toLocaleString()}
                        </p>
                        {sig.verifiedAt && (
                          <p className="text-xs text-muted-foreground">
                            Verified: {new Date(sig.verifiedAt).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Algorithm: {sig.signatureAlgorithm}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No signatures found
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Modifications Tab */}
          <TabsContent value="modifications" className="space-y-4">
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              {auditData?.modifications && auditData.modifications.length > 0 ? (
                <div className="space-y-3">
                  {auditData.modifications.map((mod: any) => (
                    <div
                      key={mod.id}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                    >
                      <Edit3 className="w-4 h-4 mt-1 text-yellow-500" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {mod.changeType} - {mod.entityType}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {mod.approvalStatus}
                          </Badge>
                        </div>
                        {mod.fieldName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Field: {mod.fieldName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(mod.timestamp).toLocaleString()}
                        </p>
                        {mod.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reason: {mod.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No modifications found
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{auditData?.auditLogs?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total Actions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{auditData?.signatures?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Signatures</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{auditData?.modifications?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Changes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
