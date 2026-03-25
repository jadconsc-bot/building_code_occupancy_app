/**
 * Verification Portal Page
 * Phase 4B: Public verification of calculations and signatures
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerificationPortal() {
  const [verificationCode, setVerificationCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const verifyMutation = trpc.verification.verify.useMutation({
    onError: (error) => {
      toast.error(error.message ?? "Verification failed — token may be invalid or expired");
    },
  });

  const handleVerify = () => {
    if (!verificationCode.trim()) {
      toast.error("Please enter a verification code");
      return;
    }
    setSubmitted(true);
    verifyMutation.mutate({ token: verificationCode.trim() });
  };

  const result = verifyMutation.data;
  const isSuccess = verifyMutation.isSuccess && !!result;
  const isError = verifyMutation.isError;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Verification Portal</h1>
        <p className="text-muted-foreground mt-2">
          Verify the authenticity and integrity of calculations
        </p>
      </div>

      {/* Verification Input */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Enter Verification Token</CardTitle>
          <CardDescription>
            Enter the verification token from a CodeComply report to verify its authenticity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Token</Label>
            <Input
              id="code"
              placeholder="e.g., a1b2c3d4e5f6..."
              value={verificationCode}
              onChange={(e) => {
                setVerificationCode(e.target.value);
                if (submitted) {
                  setSubmitted(false);
                  verifyMutation.reset();
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            />
          </div>
          <Button
            onClick={handleVerify}
            disabled={verifyMutation.isPending || !verificationCode.trim()}
            className="w-full"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying…
              </>
            ) : (
              "Verify Calculation"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Success Result */}
      {isSuccess && result && (
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Calculation ID</p>
                <p className="font-mono font-semibold text-sm break-all">
                  {result.calculationResultId}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified At</p>
                <p className="font-semibold">
                  {new Date(result.lastViewedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Verifications</p>
                <p className="font-semibold">{result.viewCount}</p>
              </div>
            </div>

            {/* Verification Checks */}
            <div className="space-y-2">
              <h3 className="font-semibold">Verification Status</h3>
              {[
                { icon: CheckCircle, label: "Token Signature", status: "Valid" },
                { icon: Clock,       label: "Token Active",   status: "Valid" },
                { icon: Lock,        label: "Public Access",  status: "Granted" },
              ].map(({ icon: Icon, label, status }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-green-600" />
                    <span>{label}</span>
                  </div>
                  <Badge className="bg-green-600">{status}</Badge>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground">
                This token is valid and the associated calculation can be viewed in the
                CodeComply platform by the calculation owner.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Result */}
      {isError && (
        <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-6 h-6" />
              Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700">
              {verifyMutation.error?.message ??
                "The token could not be verified. It may be invalid, expired, or revoked."}
            </p>
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
              All calculations are digitally signed by the professional engineer to ensure
              authenticity.
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
              Calculations are timestamped by a trusted authority to prove when they were
              created.
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
              Document integrity is verified using cryptographic hashing to detect any
              modifications.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
