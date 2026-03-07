import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, AlertTriangle, FileText, User, Calendar, Code, MessageSquare } from "lucide-react";

interface RuleChangeRequest {
  id: number;
  ruleId: string;
  changeType: "create" | "update" | "delete" | "deprecate";
  title: string;
  justification: string;
  requestedBy: {
    name: string;
    email: string;
    profession?: string;
  };
  requestedAt: Date;
  status: "pending" | "approved" | "rejected" | "implemented";
  currentValue?: string;
  proposedValue?: string;
  codeReference?: string;
}

interface AdminRuleApprovalDashboardProps {
  requests: RuleChangeRequest[];
  onApprove: (requestId: number, approvalNotes: string) => Promise<void>;
  onReject: (requestId: number, rejectionNotes: string) => Promise<void>;
  isLoading?: boolean;
}

export const AdminRuleApprovalDashboard: React.FC<AdminRuleApprovalDashboardProps> = ({
  requests,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<RuleChangeRequest | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const pendingRequests = requests.filter(r => r.status === "pending");
  const approvedRequests = requests.filter(r => r.status === "approved");
  const rejectedRequests = requests.filter(r => r.status === "rejected");
  const implementedRequests = requests.filter(r => r.status === "implemented");

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      await onApprove(selectedRequest.id, approvalNotes);
      setApprovalNotes("");
      setSelectedRequest(null);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setIsRejecting(true);
    try {
      await onReject(selectedRequest.id, rejectionNotes);
      setRejectionNotes("");
      setSelectedRequest(null);
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      case "approved":
        return "bg-green-50 border-green-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      case "implemented":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case "implemented":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle2 className="w-3 h-3 mr-1" />Implemented</Badge>;
      default:
        return null;
    }
  };

  const RequestCard: React.FC<{ request: RuleChangeRequest }> = ({ request }) => (
    <Card className={`border cursor-pointer transition-all hover:shadow-md ${getStatusColor(request.status)}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono font-bold text-primary">{request.ruleId}</span>
              <Badge variant="secondary" className="text-xs">
                {request.changeType.toUpperCase()}
              </Badge>
            </div>
            <h3 className="font-semibold text-sm mb-1">{request.title}</h3>
          </div>
          {getStatusBadge(request.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <span className="text-muted-foreground">Requested by:</span>
            <p className="font-medium">{request.requestedBy.name}</p>
            {request.requestedBy.profession && (
              <p className="text-muted-foreground">{request.requestedBy.profession}</p>
            )}
          </div>
          <div>
            <span className="text-muted-foreground">Date:</span>
            <p className="font-medium">{new Date(request.requestedAt).toLocaleDateString()}</p>
          </div>
        </div>

        {request.codeReference && (
          <div className="mb-4 p-2 bg-blue-50 rounded border border-blue-200">
            <p className="text-xs text-muted-foreground">Code Reference:</p>
            <p className="font-mono text-sm font-semibold text-blue-900">{request.codeReference}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Justification:</p>
          <p className="text-sm line-clamp-3">{request.justification}</p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedRequest(request)}
          className="w-full"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {request.status === "pending" ? "Review & Decide" : "View Details"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Rule Change Approvals</h2>
          <p className="text-muted-foreground">Review and approve professional rule modifications</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
          <p className="text-xs text-muted-foreground">Pending Review</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingRequests.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
          <TabsTrigger value="implemented">Implemented ({implementedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Alert>
              <AlertDescription>No pending rule change requests.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <Alert>
              <AlertDescription>No approved requests yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {approvedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedRequests.length === 0 ? (
            <Alert>
              <AlertDescription>No rejected requests.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {rejectedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="implemented" className="space-y-4">
          {implementedRequests.length === 0 ? (
            <Alert>
              <AlertDescription>No implemented requests yet.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {implementedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review Rule Change Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.ruleId} - {selectedRequest?.changeType.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Requestor Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Requestor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedRequest.requestedBy.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedRequest.requestedBy.email}</p>
                    </div>
                    {selectedRequest.requestedBy.profession && (
                      <div>
                        <span className="text-xs text-muted-foreground">Profession:</span>
                        <p className="font-medium">{selectedRequest.requestedBy.profession}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground">Requested:</span>
                      <p className="font-medium">{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Reference */}
              {selectedRequest.codeReference && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground mb-1">Code Reference:</p>
                    <p className="font-mono font-bold text-lg text-blue-900">{selectedRequest.codeReference}</p>
                  </CardContent>
                </Card>
              )}

              {/* Justification */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{selectedRequest.justification}</p>
                </CardContent>
              </Card>

              {/* Change Details */}
              {selectedRequest.currentValue && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Current Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
                      {selectedRequest.currentValue}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {selectedRequest.proposedValue && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Proposed Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-green-50 p-3 rounded overflow-auto max-h-32">
                      {selectedRequest.proposedValue}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Decision Section */}
              {selectedRequest.status === "pending" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <label className="text-sm font-medium">Approval Notes</label>
                    <Textarea
                      placeholder="Document your decision and any conditions..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Rejection Notes (if applicable)</label>
                    <Textarea
                      placeholder="Explain why this change is being rejected..."
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      rows={3}
                      className="mt-2"
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Your decision will be digitally signed and permanently recorded in the audit trail.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <DialogFooter className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isApproving || isRejecting}
                >
                  Close
                </Button>
                {selectedRequest.status === "pending" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isApproving || isRejecting || !rejectionNotes.trim()}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {isRejecting ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving || isRejecting || !approvalNotes.trim()}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {isApproving ? "Approving..." : "Approve"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRuleApprovalDashboard;
