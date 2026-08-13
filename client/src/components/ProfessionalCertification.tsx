/**
 * Professional certification is disabled until genuine identity validation,
 * cryptographic signing, and durable verification are implemented.
 */

interface ComplianceSnapshot {
  snapshotId: string;
  projectId: number;
  complianceStatus: "compliant" | "non_compliant" | "conditional";
  createdAt: Date;
}

export function ProfessionalCertification({ snapshot: _snapshot }: { snapshot: ComplianceSnapshot }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
      <p className="font-medium text-amber-800">Professional Certification — Coming Soon</p>
      <p className="mt-2 text-sm text-amber-700">
        Digital professional certification and signature verification are not yet available.
        CodeComply results remain preliminary compliance assistance documents and must be
        independently reviewed by a licensed professional before permit submission.
      </p>
    </div>
  );
}
