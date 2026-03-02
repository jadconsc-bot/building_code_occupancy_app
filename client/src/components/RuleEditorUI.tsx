import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, Lock, Clock, User, FileText, Send, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface RuleEditorUIProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "editor" | "user";
  };
  onSubmitChange: (changeRequest: {
    ruleId: string;
    changeType: "create" | "update" | "delete";
    title: string;
    description: string;
    justification: string;
    newContent?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const RuleEditorUI: React.FC<RuleEditorUIProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitChange,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    ruleId: "",
    changeType: "update" as const,
    title: "",
    description: "",
    justification: "",
    newContent: "",
  });

  const [showCredentialVerification, setShowCredentialVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ruleId || !formData.title || !formData.justification) {
      alert("Please fill in all required fields");
      return;
    }

    if (currentUser.role !== "admin" && currentUser.role !== "editor") {
      alert("You do not have permission to submit rule changes");
      return;
    }

    try {
      await onSubmitChange(formData);
      setFormData({
        ruleId: "",
        changeType: "update",
        title: "",
        description: "",
        justification: "",
        newContent: "",
      });
      onClose();
    } catch (error) {
      console.error("Error submitting rule change:", error);
      alert("Failed to submit rule change. Please try again.");
    }
  };

  const handleReset = () => {
    setFormData({
      ruleId: "",
      changeType: "update",
      title: "",
      description: "",
      justification: "",
      newContent: "",
    });
    setVerificationCode("");
    setShowCredentialVerification(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Professional Rule Editor
            </DialogTitle>
            <DialogDescription>
              Submit rule changes for administrative review and approval
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Credential Display */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Your Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{currentUser.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <Badge variant="outline" className="mt-1">
                      {currentUser.role.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">User ID:</span>
                    <p className="font-mono text-xs">{currentUser.id.substring(0, 8)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permission Check */}
            {currentUser.role !== "admin" && currentUser.role !== "editor" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You do not have permission to submit rule changes. Only administrators and editors can modify rules.
                </AlertDescription>
              </Alert>
            )}

            {/* Rule ID */}
            <div>
              <label className="text-sm font-medium">Rule ID *</label>
              <Input
                placeholder="e.g., NBC-3.4.6.5"
                value={formData.ruleId}
                onChange={(e) => setFormData({ ...formData, ruleId: e.target.value })}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The unique identifier for the rule being modified
              </p>
            </div>

            {/* Change Type */}
            <div>
              <label className="text-sm font-medium">Change Type *</label>
              <div className="flex gap-2 mt-2">
                {(["create", "update", "delete"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={formData.changeType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, changeType: type })}
                    disabled={isSubmitting}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium">Change Title *</label>
              <Input
                placeholder="Brief title of the rule change"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Detailed description of the change"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* New Content (for updates/creates) */}
            {formData.changeType === "update" || formData.changeType === "create" && (
              <div>
                <label className="text-sm font-medium">New Rule Content</label>
                <Textarea
                  placeholder="The new or updated rule content"
                  value={formData.newContent}
                  onChange={(e) => setFormData({ ...formData, newContent: e.target.value })}
                  disabled={isSubmitting}
                  rows={4}
                />
              </div>
            )}

            {/* Justification */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Justification for Change *
              </label>
              <Textarea
                placeholder="Explain why this change is necessary. Reference specific code clauses, safety concerns, or compliance requirements."
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                disabled={isSubmitting}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This justification will be reviewed by administrators and included in the audit trail
              </p>
            </div>

            {/* Legal Notice */}
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Legal Notice:</strong> All rule changes are digitally signed, timestamped, and permanently recorded in the audit trail. False or misleading justifications may result in account suspension or legal action.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <DialogFooter className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  currentUser.role !== "admin" &&
                  currentUser.role !== "editor"
                }
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credential Verification Dialog */}
      <Dialog open={showCredentialVerification} onOpenChange={setShowCredentialVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Credentials</DialogTitle>
            <DialogDescription>
              Enter your verification code to confirm your identity
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCredentialVerification(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCredentialVerification(false)}>
                Verify
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RuleEditorUI;
