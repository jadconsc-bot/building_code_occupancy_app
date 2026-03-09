import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CertificateGeneratorProps {
  onSuccess?: (certificateId: string) => void;
}

export function CertificateGenerator({ onSuccess }: CertificateGeneratorProps) {
  const [formData, setFormData] = useState({
    projectName: "",
    projectDescription: "",
    complianceStatus: "compliant",
    engineerName: "",
    engineerEmail: "",
    engineerLicense: "",
    findings: "",
  });

  const generateMutation = trpc.certification.generateCertificate.useMutation({
    onSuccess: (result) => {
      toast.success("Certificate generated successfully!");
      setFormData({
        projectName: "",
        projectDescription: "",
        complianceStatus: "compliant",
        engineerName: "",
        engineerEmail: "",
        engineerLicense: "",
        findings: "",
      });
      onSuccess?.(result.certificateId);
    },
    onError: (error) => {
      toast.error(`Failed to generate certificate: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName || !formData.engineerName || !formData.engineerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    const mockSnapshot = {
      snapshotId: `snapshot-${Date.now()}`,
      projectId: `project-${Date.now()}`,
      userId: `user-${Date.now()}`,
      rulesetId: "default-ruleset",
      complianceStatus: formData.complianceStatus.replace("-", "_") as "compliant" | "non_compliant" | "needs_review",
      inputs: {
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        engineerName: formData.engineerName,
        engineerEmail: formData.engineerEmail,
        engineerLicense: formData.engineerLicense,
      },
      outputs: formData.findings ? JSON.parse(formData.findings) : [],
      ruleTrace: [],
      createdAt: new Date(),
    };

    generateMutation.mutate(mockSnapshot);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate New Certificate</CardTitle>
        <CardDescription>Create a new compliance certificate with digital signature and timestamp</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Project Information</h3>
            
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., Downtown Office Building"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="projectDescription">Project Description</Label>
              <Textarea
                id="projectDescription"
                placeholder="Describe the project scope and location"
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="complianceStatus">Compliance Status *</Label>
              <Select value={formData.complianceStatus} onValueChange={(value) => setFormData({ ...formData, complianceStatus: value })}>
                <SelectTrigger id="complianceStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliant">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Compliant
                    </div>
                  </SelectItem>
                  <SelectItem value="non-compliant">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      Non-Compliant
                    </div>
                  </SelectItem>
                  <SelectItem value="needs-review">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Needs Review
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Engineer Information</h3>
            
            <div>
              <Label htmlFor="engineerName">Engineer Name *</Label>
              <Input
                id="engineerName"
                placeholder="Full name"
                value={formData.engineerName}
                onChange={(e) => setFormData({ ...formData, engineerName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="engineerEmail">Engineer Email *</Label>
              <Input
                id="engineerEmail"
                type="email"
                placeholder="email@example.com"
                value={formData.engineerEmail}
                onChange={(e) => setFormData({ ...formData, engineerEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="engineerLicense">Professional License Number</Label>
              <Input
                id="engineerLicense"
                placeholder="e.g., PE12345"
                value={formData.engineerLicense}
                onChange={(e) => setFormData({ ...formData, engineerLicense: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Compliance Findings</h3>
            
            <div>
              <Label htmlFor="findings">Findings (JSON format)</Label>
              <Textarea
                id="findings"
                placeholder='[{"rule": "Fire Safety", "status": "pass", "notes": "All exits properly marked"}]'
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={4}
              />
              <p className="text-sm text-muted-foreground mt-2">Optional: Enter compliance findings as JSON array</p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Legal Notice:</strong> This certificate is generated for informational purposes only. 
              All results must be verified by an accredited professional before use. The system maintains 
              immutable audit trails and digital signatures for legal defensibility.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={generateMutation.isPending}
              className="flex-1"
            >
              {generateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {generateMutation.isPending ? "Generating..." : "Generate Certificate"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
