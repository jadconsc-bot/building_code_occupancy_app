import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import { FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CertificateExportProps {
  certificateId?: string;
}

export function CertificateExport({ certificateId: initialCertificateId }: CertificateExportProps) {
  const [certificateId, setCertificateId] = useState(initialCertificateId || "");
  const [exportFormat, setExportFormat] = useState<"pdf" | "json" | "csv">("pdf");
  const [pdfOptions, setPdfOptions] = useState({
    pageSize: "A4",
    orientation: "portrait",
    includeCertificateInfo: true,
    includeSignature: true,
    includeTimestamp: true,
    includeAuditTrail: true,
  });

  const exportPdfMutation = trpc.certification.exportCertificatePDF.useMutation({
    onSuccess: (result) => {
      toast.success(`Certificate exported as PDF: ${result.fileName}`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportJsonMutation = trpc.certification.exportCertificateJSON.useMutation({
    onSuccess: (result) => {
      toast.success(`Certificate exported as JSON: ${result.fileName}`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const exportCsvMutation = trpc.certification.exportCertificateCSV.useMutation({
    onSuccess: (result) => {
      toast.success(`Certificate exported as CSV: ${result.fileName}`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const handleExport = () => {
    if (!certificateId) {
      toast.error("Please enter a certificate ID");
      return;
    }

    switch (exportFormat) {
      case "pdf":
        exportPdfMutation.mutate({
          certificateId,
          includeSignature: pdfOptions.includeSignature,
          includeTimestamp: pdfOptions.includeTimestamp,
          includeAuditTrail: pdfOptions.includeAuditTrail,
          pageSize: pdfOptions.pageSize as "A4" | "Letter",
          orientation: pdfOptions.orientation as "portrait" | "landscape",
        });
        break;
      case "json":
        exportJsonMutation.mutate({ certificateId });
        break;
      case "csv":
        exportCsvMutation.mutate({ certificateId });
        break;
    }
  };

  const isLoading = exportPdfMutation.isPending || exportJsonMutation.isPending || exportCsvMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Certificate</CardTitle>
        <CardDescription>Export your certificate in multiple formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Certificate ID Input */}
        <div>
          <Label htmlFor="certificateId">Certificate ID</Label>
          <Input
            id="certificateId"
            placeholder="Enter certificate ID"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
          />
        </div>

        {/* Export Format Selection */}
        <div>
          <Label htmlFor="exportFormat">Export Format</Label>
          <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "pdf" | "json" | "csv")}>
            <SelectTrigger id="exportFormat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF (Professional Document)</SelectItem>
              <SelectItem value="json">JSON (Data Format)</SelectItem>
              <SelectItem value="csv">CSV (Spreadsheet Format)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PDF Options */}
        {exportFormat === "pdf" && (
          <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
            <h3 className="font-semibold">PDF Options</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pageSize">Page Size</Label>
                <Select value={pdfOptions.pageSize} onValueChange={(value) => setPdfOptions({ ...pdfOptions, pageSize: value })}>
                  <SelectTrigger id="pageSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="orientation">Orientation</Label>
                <Select value={pdfOptions.orientation} onValueChange={(value) => setPdfOptions({ ...pdfOptions, orientation: value })}>
                  <SelectTrigger id="orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeCertificateInfo"
                  checked={pdfOptions.includeCertificateInfo}
                  onCheckedChange={(checked) => setPdfOptions({ ...pdfOptions, includeCertificateInfo: checked as boolean })}
                />
                <Label htmlFor="includeCertificateInfo" className="cursor-pointer">Include Certificate Information</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeSignature"
                  checked={pdfOptions.includeSignature}
                  onCheckedChange={(checked) => setPdfOptions({ ...pdfOptions, includeSignature: checked as boolean })}
                />
                <Label htmlFor="includeSignature" className="cursor-pointer">Include Digital Signature</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeTimestamp"
                  checked={pdfOptions.includeTimestamp}
                  onCheckedChange={(checked) => setPdfOptions({ ...pdfOptions, includeTimestamp: checked as boolean })}
                />
                <Label htmlFor="includeTimestamp" className="cursor-pointer">Include RFC 3161 Timestamp</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeAuditTrail"
                  checked={pdfOptions.includeAuditTrail}
                  onCheckedChange={(checked) => setPdfOptions({ ...pdfOptions, includeAuditTrail: checked as boolean })}
                />
                <Label htmlFor="includeAuditTrail" className="cursor-pointer">Include Audit Trail</Label>
              </div>
            </div>
          </div>
        )}

        {/* Export Information */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Export Information</p>
              <p>
                {exportFormat === "pdf" && "PDF exports include professional formatting with digital signatures and legal disclaimers."}
                {exportFormat === "json" && "JSON exports contain complete certificate data including all metadata and audit trails."}
                {exportFormat === "csv" && "CSV exports are suitable for spreadsheet analysis and data integration."}
              </p>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isLoading || !certificateId}
          className="w-full"
        >
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isLoading ? "Exporting..." : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export as {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
