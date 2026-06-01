/**
 * Verification Portal Page
 * Phase 4B: Public verification of calculations and signatures
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, Lock } from "lucide-react";
import { toast } from "sonner";

export default function VerificationPortal() {
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = () => {
    if (!verificationCode.trim()) {
      toast.error("Please enter a verification code");
      return;
    }

    // Mock verification result
    setVerificationResult({
      status: "verified",
      calculationId: "CALC-2026-001234",
      projectName: "Downtown Office Tower",
      occupancy: "D",
      occupantLoad: 150,
      verifiedAt: "2026-03-01T10:30:00Z",
      signatureStatus: "valid",
      timestampStatus: "valid",
      integrityStatus: "verified",
      engineer: "Jose Acevedo, P.Eng.",
      firm: "CodeComply Engineering",
      auditId: "AUD-2026-001234",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Verification Portal</h1>
        <p className="text-muted-foreground mt-2">Verify the authenticity and integrity of calculations</p>
      </div>

      {/* Verification Input */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Enter Verification Code</CardTitle>
          <CardDescription>
            Enter the verification code from a CodeComply report to verify its authenticity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="e.g., VERIFY-2026-ABC123XYZ789"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>
          <Button onClick={handleVerify} className="w-full">
            Verify Calculation
          </Button>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card className="max-w-2xl mx-auto border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Verification Successful
              </CardTitle>
              <Badge className="bg-green-600">Verified</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calculation Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Calculation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Calculation ID</p>
                  <p className="font-mono font-semibold">{verificationResult.calculationId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-semibold">{verificationResult.projectName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy Type</p>
                  <p className="font-semibold">{verificationResult.occupancy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Occupant Load</p>
                  <p className="font-semibold">{verificationResult.occupantLoad}</p>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="space-y-4">
              <h3 className="font-semibold">Verification Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Digital Signature</span>
                  </div>
                  <Badge className="bg-green-600">Valid</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span>Timestamp Authority</span>
                  </div>
                  <Badge className="bg-green-600">Valid</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-600" />
                    <span>Document Integrity</span>
                  </div>
                  <Badge className="bg-green-600">Verified</Badge>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Professional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Engineer</p>
                  <p className="font-semibold">{verificationResult.engineer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Firm</p>
                  <p className="font-semibold">{verificationResult.firm}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified At</p>
                  <p className="font-semibold">
                    {new Date(verificationResult.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Audit ID</p>
                  <p className="font-mono font-semibold text-xs">{verificationResult.auditId}</p>
                </div>
              </div>
            </div>

            {/* Legal Notice */}
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground">
                This calculation has been verified as authentic and unmodified. The digital signature and timestamp prove the calculation was performed by the listed professional on the specified date.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Digital Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All calculations are digitally signed by the professional engineer to ensure authenticity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timestamp Authority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calculations are timestamped by a trusted authority to prove when they were created.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Integrity Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Document integrity is verified using cryptographic hashing to detect any modifications.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
