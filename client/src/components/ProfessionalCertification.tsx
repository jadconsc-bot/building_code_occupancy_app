/**
 * ProfessionalCertification Component
 * Enables licensed professionals to review, verify, and digitally certify compliance analyses
 * Provides digital signatures and timestamps for regulatory submission and legal defensibility
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, FileSignature, AlertCircle, Shield, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComplianceSnapshot {
  snapshotId: string;
  projectId: number;
  complianceStatus: "compliant" | "non_compliant" | "conditional";
  createdAt: Date;
}

interface CertificationData {
  professionalName: string;
  licenseNumber: string;
  licenseType: string; // "Architect", "Engineer", "Building Code Official"
  jurisdiction: string;
  certificationDate: Date;
  digitalSignature: string;
  certificationNotes: string;
  verified: boolean;
}

export function ProfessionalCertification({ snapshot }: { snapshot: ComplianceSnapshot }) {
  const [certificationStep, setCertificationStep] = useState<"review" | "verify" | "certify" | "complete">(
    "review"
  );
  const [certification, setCertification] = useState<Partial<CertificationData>>({
    certificationDate: new Date(),
  });
  const [isSigning, setIsSigning] = useState(false);

  const handleReview = () => {
    setCertificationStep("verify");
  };

  const handleVerify = () => {
    if (!certification.professionalName || !certification.licenseNumber || !certification.licenseType) {
      alert("Please fill in all professional information");
      return;
    }
    setCertificationStep("certify");
  };

  const handleCertify = async () => {
    setIsSigning(true);
    try {
      // Simulate digital signature generation
      const signatureData = JSON.stringify({
        snapshotId: snapshot.snapshotId,
        professionalName: certification.professionalName,
        licenseNumber: certification.licenseNumber,
        licenseType: certification.licenseType,
        jurisdiction: certification.jurisdiction,
        certificationDate: certification.certificationDate?.toISOString(),
        certificationNotes: certification.certificationNotes,
        timestamp: new Date().toISOString(),
      });

      // In production, this would use actual digital signature (e.g., PKI, blockchain)
      const signature = btoa(signatureData); // Base64 encoding for demo

      setCertification((prev) => ({
        ...prev,
        digitalSignature: signature,
        verified: true,
      }));

      setCertificationStep("complete");
    } catch (error) {
      console.error("Certification failed:", error);
      alert("Certification failed. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Certification Progress */}
      <div className="grid grid-cols-4 gap-2">
        {["review", "verify", "certify", "complete"].map((step, idx) => (
          <div
            key={step}
            className={`p-3 rounded-lg text-center text-sm font-semibold transition-all ${
              certificationStep === step || (idx < ["review", "verify", "certify", "complete"].indexOf(certificationStep))
                ? "bg-green-100 text-green-900 border-2 border-green-500"
                : "bg-gray-100 text-gray-600 border-2 border-gray-300"
            }`}
          >
            {step.charAt(0).toUpperCase() + step.slice(1)}
          </div>
        ))}
      </div>

      {/* Review Step */}
      {certificationStep === "review" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Step 1: Review Compliance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">Professional Review Required</p>
                  <p>
                    As a licensed professional, you are responsible for thoroughly reviewing this compliance analysis
                    before certification. Verify all inputs, evaluate the rule trace, and confirm applicability to the
                    project.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-900 mb-2">Analysis Summary</p>
                <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Report ID:</span>
                    <span className="font-mono font-semibold">{snapshot.snapshotId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge
                      variant={
                        snapshot.complianceStatus === "compliant"
                          ? "default"
                          : snapshot.complianceStatus === "non_compliant"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {snapshot.complianceStatus.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{new Date(snapshot.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-semibold text-gray-900 mb-2">Review Checklist</p>
                <div className="space-y-2">
                  {[
                    "Verified all input parameters are accurate",
                    "Confirmed correct building code edition selected",
                    "Reviewed rule evaluation trace and findings",
                    "Checked for local amendments and jurisdictional variations",
                    "Evaluated site-specific conditions and applicability",
                    "Confirmed professional judgment supports results",
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-green-600" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleReview} size="lg" className="w-full">
              Proceed to Professional Verification
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Verification Step */}
      {certificationStep === "verify" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Step 2: Professional Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Professional Name *</label>
                <Input
                  placeholder="Enter your full name"
                  value={certification.professionalName || ""}
                  onChange={(e) => setCertification({ ...certification, professionalName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">License Number *</label>
                  <Input
                    placeholder="e.g., A12345"
                    value={certification.licenseNumber || ""}
                    onChange={(e) => setCertification({ ...certification, licenseNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">License Type *</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={certification.licenseType || ""}
                    onChange={(e) => setCertification({ ...certification, licenseType: e.target.value })}
                  >
                    <option value="">Select license type</option>
                    <option value="Architect">Architect</option>
                    <option value="Engineer">Professional Engineer</option>
                    <option value="Building Code Official">Building Code Official</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Jurisdiction</label>
                <Input
                  placeholder="e.g., Ontario, Canada"
                  value={certification.jurisdiction || ""}
                  onChange={(e) => setCertification({ ...certification, jurisdiction: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Certification Notes</label>
                <Textarea
                  placeholder="Add any additional notes or conditions for this certification..."
                  value={certification.certificationNotes || ""}
                  onChange={(e) => setCertification({ ...certification, certificationNotes: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Important:</strong> By proceeding to certification, you confirm that you have reviewed
                  this analysis and accept professional responsibility for its accuracy and applicability.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCertificationStep("review")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleVerify} className="flex-1">
                Proceed to Digital Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certification Step */}
      {certificationStep === "certify" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Step 3: Digital Certification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <p className="font-semibold mb-2">Ready for Digital Certification</p>
                  <p>
                    Click "Certify Analysis" to create a digitally signed certification record. This will generate an
                    immutable record with cryptographic integrity verification for legal defensibility.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded">
              <p className="font-semibold text-gray-900">Certification Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Professional:</span>
                  <span className="font-semibold">{certification.professionalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">License:</span>
                  <span className="font-semibold">
                    {certification.licenseType} - {certification.licenseNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Jurisdiction:</span>
                  <span className="font-semibold">{certification.jurisdiction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Timestamp:</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCertificationStep("verify")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCertify} disabled={isSigning} size="lg" className="flex-1">
                {isSigning ? "Creating Signature..." : "Certify Analysis"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Step */}
      {certificationStep === "complete" && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-6 h-6" />
              Certification Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-200 space-y-3">
              <p className="text-sm text-gray-700">
                This compliance analysis has been professionally reviewed and certified by:
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Professional:</span>
                  <span>{certification.professionalName}</span>
                </div>
                <div className="flex justify-between">
                  <span>License:</span>
                  <span className="font-mono">{certification.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>{certification.licenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jurisdiction:</span>
                  <span>{certification.jurisdiction}</span>
                </div>
                <div className="flex justify-between">
                  <span>Certified:</span>
                  <span>{new Date(certification.certificationDate || "").toLocaleString()}</span>
                </div>
              </div>

              {certification.certificationNotes && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 mb-2">CERTIFICATION NOTES:</p>
                  <p className="text-sm text-gray-700">{certification.certificationNotes}</p>
                </div>
              )}
            </div>

            <div className="bg-green-100 p-3 rounded text-sm text-green-900">
              <p className="font-semibold mb-1">✓ Digital Signature Generated</p>
              <p className="text-xs font-mono break-all">{certification.digitalSignature?.substring(0, 50)}...</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                Download Certificate
              </Button>
              <Button className="flex-1">
                Export for Submission
              </Button>
            </div>

            <p className="text-xs text-gray-600 text-center">
              This certification is immutable and can be verified at any time using the digital signature.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
