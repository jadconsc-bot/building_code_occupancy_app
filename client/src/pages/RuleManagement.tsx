import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, FileText, Users, History, Lock } from "lucide-react";
import RuleEditorUI from "@/components/RuleEditorUI";
import AdminRuleApprovalDashboard from "@/components/AdminRuleApprovalDashboard";

export default function RuleManagement() {
  const { user, loading, error } = useAuth();
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !user) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Authentication error. Please log in to access rule management.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user && user.role === "admin";
  const isEditor = user && user.role === "admin";

  const handleSubmitRuleChange = async (changeRequest: any) => {
    setIsSubmitting(true);
    try {
      // This would call the tRPC procedure
      // await trpc.ruleManagement.requestRuleChange.useMutation(changeRequest);
      console.log("Rule change submitted:", changeRequest);
      // Show success toast
    } catch (error) {
      console.error("Error submitting rule change:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Professional Rule Management</h1>
          <p className="text-muted-foreground mt-2">
            Submit, review, and manage building code rule changes with full audit trails and digital signatures
          </p>
        </div>

        {/* Permission Alert */}
        {!isEditor && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to submit rule changes. Contact an administrator to request editor credentials.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="editor" disabled={!isEditor}>
              Submit Changes
            </TabsTrigger>
            <TabsTrigger value="approvals" disabled={!isAdmin}>
              Approvals
            </TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Your Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold capitalize">{user.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isEditor ? "You can submit rule changes" : "Contact admin for editor access"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting admin review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Total Changes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
            </div>

            {/* Features Overview */}
            <Card>
              <CardHeader>
                <CardTitle>System Features</CardTitle>
                <CardDescription>
                  Professional-grade rule management with legal defensibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Credential Verification</h4>
                      <p className="text-xs text-muted-foreground">Professional licenses verified and tracked</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Digital Signatures</h4>
                      <p className="text-xs text-muted-foreground">Cryptographic signatures for all changes</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Immutable Audit Trail</h4>
                      <p className="text-xs text-muted-foreground">Complete history with blockchain-like integrity</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Admin Approval Workflow</h4>
                      <p className="text-xs text-muted-foreground">Multi-level review and authorization</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Legal Defensibility</h4>
                      <p className="text-xs text-muted-foreground">Court-ready documentation and timestamps</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold">✓</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Notification System</h4>
                      <p className="text-xs text-muted-foreground">Stakeholders notified of all changes</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor Tab */}
          {isEditor && (
            <TabsContent value="editor" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Submit Rule Change</CardTitle>
                  <CardDescription>
                    Propose modifications to building code rules with full justification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setShowRuleEditor(true)}
                    size="lg"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Open Rule Editor
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Submissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Recent Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No submissions yet</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Approvals Tab */}
          {isAdmin && (
            <TabsContent value="approvals" className="space-y-6">
              <AdminRuleApprovalDashboard
                requests={[]}
                onApprove={async (requestId, notes) => {
                  console.log("Approved:", requestId, notes);
                }}
                onReject={async (requestId, notes) => {
                  console.log("Rejected:", requestId, notes);
                }}
              />
            </TabsContent>
          )}

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  Complete immutable history of all rule changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No audit entries yet</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rule Editor Dialog */}
      <RuleEditorUI
        isOpen={showRuleEditor}
        onClose={() => setShowRuleEditor(false)}
        currentUser={{
          id: user.id?.toString() || "",
          name: user.name || "Unknown",
          email: user.email || "",
          role: (user.role as "admin" | "editor" | "user") || "user",
        }}
        onSubmitChange={handleSubmitRuleChange}
        isSubmitting={isSubmitting}
      />
    </DashboardLayout>
  );
}
