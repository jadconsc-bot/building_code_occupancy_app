import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function PublicVerification() {
  const [certificateId, setCertificateId] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyQuery = trpc.certification.verifyCertificate.useQuery(
    { certificateId: certificateId || "" },
    {
      enabled: false,
    }
  );

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();

    if (!certificateId) {
      toast.error("Please enter a certificate ID");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    verifyQuery.refetch().then(({ data, error }) => {
      setIsVerifying(false);
      if (data) {
        setVerificationResult(data);
        if (data.isValid) {
          toast.success("Certificate verified successfully");
        } else {
          toast.error("Certificate verification failed");
        }
      }
      if (error) {
        toast.error(`Verification failed: ${error.message}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Verify Certificate</CardTitle>
          <CardDescription>Enter a certificate ID to verify its authenticity and integrity</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="certificateId">Certificate ID</Label>
              <Input
                id="certificateId"
                placeholder="Enter certificate ID to verify"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isVerifying ? "Verifying..." : "Verify Certificate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification Results</CardTitle>
              <Badge variant={verificationResult.isValid ? "default" : "destructive"}>
                {verificationResult.isValid ? "Valid" : "Invalid"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Status */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {verificationResult.isValid ? (
                <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h3 className="font-semibold">
                  {verificationResult.isValid
                    ? "Certificate is Valid"
                    : "Certificate is Invalid"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {verificationResult.message}
                </p>
              </div>
            </div>

            {/* Certificate Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Certificate Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Certificate ID</p>
                  <p className="font-mono text-sm">{verificationResult.certificateId}</p>
                </div>

                <div className="p-3 border border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={verificationResult.complianceStatus === "compliant" ? "default" : "secondary"}>
                    {verificationResult.complianceStatus}
                  </Badge>
                </div>

                {verificationResult.generatedAt && (
                  <div className="p-3 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Generated</p>
                    <p className="text-sm">
                      {new Date(verificationResult.generatedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {verificationResult.signerName && (
                  <div className="p-3 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">Signer</p>
                    <p className="text-sm">{verificationResult.signerName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Checks */}
            <div className="space-y-4">
              <h3 className="font-semibold">Verification Checks</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  {verificationResult.signatureValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Digital Signature</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationResult.signatureValid ? "Valid" : "Invalid"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  {verificationResult.timestampValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">RFC 3161 Timestamp</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationResult.timestampValid ? "Valid" : "Invalid"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  {verificationResult.integrityValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">Data Integrity</p>
                    <p className="text-xs text-muted-foreground">
                      {verificationResult.integrityValid ? "Valid" : "Corrupted"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Verification Information</p>
                  <p>
                    This certificate has been verified for authenticity and integrity. 
                    The digital signature and RFC 3161 timestamp confirm that the certificate 
                    has not been modified since generation. All results must be verified by 
                    an accredited professional before use.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
