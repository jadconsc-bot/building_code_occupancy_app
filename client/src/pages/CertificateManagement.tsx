import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Plus, Search, CheckCircle2, Loader2, Download } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CertificateManagement() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewCertId, setViewCertId] = useState<string | null>(null);

  // Verify tab state
  const [verifyCertId, setVerifyCertId] = useState("");

  // Fetch user's certificates
  const { data: certificates, isLoading: certificatesLoading } =
    trpc.certification.listCertificates.useQuery(
      { limit: 50, offset: 0 },
      { enabled: isAuthenticated }
    );

  // View certificate detail
  const { data: certDetail, isLoading: certDetailLoading } =
    trpc.certification.getCertificate.useQuery(
      { certificateId: viewCertId! },
      { enabled: !!viewCertId }
    );

  // Verify certificate
  const { data: verifyResult, isLoading: verifyLoading, refetch: refetchVerify } =
    trpc.certification.verifyCertificate.useQuery(
      { certificateId: verifyCertId },
      { enabled: false }
    );

  const handleVerify = async () => {
    if (!verifyCertId.trim()) {
      toast.error("Please enter a Certificate ID");
      return;
    }
    await refetchVerify();
  };

  // Export PDF mutation
  const exportPdfMutation = trpc.certification.exportCertificatePDF.useMutation({
    onSuccess: (data) => {
      toast.success(`Certificate exported — ${data.filename ?? "certificate.pdf"}`);
    },
    onError: (error) => {
      toast.error(error.message ?? "Export failed");
    },
  });

  const handleExport = (certificateId: string) => {
    exportPdfMutation.mutate({ certificateId });
  };

  const filteredCerts =
    (certificates?.certificates ?? []).filter((cert: any) =>
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Certificate Management</CardTitle>
            <CardDescription>Please log in to manage your certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to be authenticated to access certificate management features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Certificate Management</h1>
        <p className="text-muted-foreground">
          Manage, generate, export, and verify your compliance certificates
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="list">
            <FileText className="w-4 h-4 mr-2" />
            Certificates
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Plus className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="w-4 h-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="verify">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Verify
          </TabsTrigger>
        </TabsList>

        {/* Certificate List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>View and manage all your compliance certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    className="w-full pl-9 pr-4 py-2 border border-input rounded-md"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {certificatesLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading certificates...
                </div>
              ) : filteredCerts.length > 0 ? (
                <div className="space-y-4">
                  {filteredCerts.map((cert: any) => (
                    <div
                      key={cert.certificateId}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold font-mono text-sm">{cert.certificateId}</h3>
                          <Badge
                            variant={cert.complianceStatus === "compliant" ? "default" : "secondary"}
                          >
                            {cert.complianceStatus}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Generated {new Date(cert.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewCertId(cert.certificateId)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(cert.certificateId)}
                          disabled={exportPdfMutation.isPending}
                        >
                          {exportPdfMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Export"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No certificates yet. Create one to get started.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab("generate")}>
                    Generate Certificate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Generate Certificate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Certificate</CardTitle>
              <CardDescription>
                Create a compliance certificate — go to Compliance Engine to run an analysis first, then
                return here to generate a certificate from the snapshot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Certificate generation will be available after completing a compliance analysis.
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the Compliance Engine to run and snapshot an analysis, then generate a certificate here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Certificate Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Certificate</CardTitle>
              <CardDescription>Export a certificate in PDF format by ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-cert-id">Certificate ID</Label>
                <Input
                  id="export-cert-id"
                  placeholder="e.g. cert_abc123..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const id = (e.target as HTMLInputElement).value.trim();
                      if (id) handleExport(id);
                    }
                  }}
                />
              </div>
              <Button
                className="w-full"
                onClick={(e) => {
                  const input = document.getElementById("export-cert-id") as HTMLInputElement;
                  if (!input?.value.trim()) {
                    toast.error("Please enter a Certificate ID");
                    return;
                  }
                  handleExport(input.value.trim());
                }}
                disabled={exportPdfMutation.isPending}
              >
                {exportPdfMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  "Export PDF"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                JSON and CSV export formats coming in next phase
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verify Certificate Tab */}
        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify Certificate</CardTitle>
              <CardDescription>
                Verify the authenticity and integrity of any certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-cert-id">Certificate ID</Label>
                <Input
                  id="verify-cert-id"
                  placeholder="e.g. cert_abc123..."
                  value={verifyCertId}
                  onChange={(e) => setVerifyCertId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={verifyLoading || !verifyCertId.trim()}
              >
                {verifyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify Certificate"
                )}
              </Button>

              {verifyResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    verifyResult.isValid
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className={`font-semibold ${verifyResult.isValid ? "text-green-700" : "text-red-700"}`}>
                    {verifyResult.isValid ? "Certificate Valid" : "Certificate Invalid"}
                  </p>
                  <p className="text-sm mt-1 text-muted-foreground">{verifyResult.message}</p>
                  {verifyResult.issues && verifyResult.issues.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {verifyResult.issues.map((issue: string, i: number) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Certificate Detail Dialog */}
      <Dialog open={!!viewCertId} onOpenChange={(open) => { if (!open) setViewCertId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certificate Details</DialogTitle>
            <DialogDescription>
              {viewCertId}
            </DialogDescription>
          </DialogHeader>
          {certDetailLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : certDetail ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Certificate ID</p>
                <p className="font-mono font-semibold">{certDetail.certificateId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Version</p>
                <p className="font-semibold">{certDetail.version}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Generated At</p>
                <p className="font-semibold">{new Date(certDetail.generatedAt).toLocaleString()}</p>
              </div>
              {certDetail.signer && (
                <div>
                  <p className="text-muted-foreground">Signed By</p>
                  <p className="font-semibold">{certDetail.signer.userName} ({certDetail.signer.userRole})</p>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { handleExport(viewCertId!); setViewCertId(null); }}
                  disabled={exportPdfMutation.isPending}
                >
                  Export PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
