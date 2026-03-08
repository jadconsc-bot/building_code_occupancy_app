/**
 * Phase 2 Report Manager Component
 * 
 * Provides UI for:
 * - Saving compliance and calculation reports
 * - Viewing saved reports
 * - Exporting reports
 * - Managing report metadata
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
import { Loader2, Save, Download, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface ReportManagerProps {
  projectId?: number;
  onReportSaved?: (reportId: number) => void;
}

export function Phase2ReportManager({ projectId, onReportSaved }: ReportManagerProps) {
  const [reportName, setReportName] = useState("");
  const [reportType, setReportType] = useState<"compliance" | "calculation" | "pathway" | "batch">("compliance");
  const [reportContent, setReportContent] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Queries
  const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = trpc.phase2.getReports.useQuery();
  const { data: projectReports } = trpc.phase2.getProjectReports.useQuery(
    { projectId: projectId || 0 },
    { enabled: !!projectId }
  );

  // Mutations
  const saveReportMutation = trpc.phase2.saveReport.useMutation({
    onSuccess: (data) => {
      toast.success("Report saved successfully");
      setReportName("");
      setReportContent("");
      setIsOpen(false);
      refetchReports();
      onReportSaved?.(data.id);
    },
    onError: (error) => {
      toast.error(`Failed to save report: ${error.message}`);
    },
  });

  const deleteReportMutation = trpc.phase2.deleteReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted successfully");
      refetchReports();
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });

  const handleSaveReport = () => {
    if (!reportName.trim()) {
      toast.error("Report name is required");
      return;
    }

    try {
      const content = reportContent ? JSON.parse(reportContent) : {};
      saveReportMutation.mutate({
        projectId,
        name: reportName,
        type: reportType,
        content,
      });
    } catch (error) {
      toast.error("Invalid JSON content");
    }
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReportMutation.mutate({ reportId });
    }
  };

  const displayReports = projectId ? projectReports : reports;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Report Management</CardTitle>
          <CardDescription>Save and manage compliance and calculation reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Save Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Report Name</label>
                  <Input
                    placeholder="e.g., Compliance Report - Building A"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="calculation">Calculation</SelectItem>
                      <SelectItem value="pathway">Pathway</SelectItem>
                      <SelectItem value="batch">Batch Comparison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Report Content (JSON)</label>
                  <Textarea
                    placeholder='{"infractions": [], "status": "compliant"}'
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    rows={6}
                  />
                </div>

                <Button
                  onClick={handleSaveReport}
                  disabled={saveReportMutation.isPending}
                  className="w-full"
                >
                  {saveReportMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Reports List */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm">Saved Reports ({displayReports?.length || 0})</h3>
            {reportsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : displayReports && displayReports.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayReports.map((report: any) => (
                  <Card key={report.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{report.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {report.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No reports saved yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Viewer */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedReport.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Type: {selectedReport.type}</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Created: {new Date(selectedReport.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(selectedReport.content, null, 2)}
                </pre>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedReport.content, null, 2));
                  toast.success("Report content copied to clipboard");
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Copy Content
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
