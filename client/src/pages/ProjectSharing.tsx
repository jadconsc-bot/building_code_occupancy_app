/**
 * Project Sharing & Share Links Page
 * Phase 2D: Reviewer access and read-only share links
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Trash2, Eye, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccessLevel = "view_only" | "comment" | "download";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectSharing() {
  // Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create share link form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("view_only");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxAccess, setMaxAccess] = useState("");

  // Verification link form state
  const [verificationCalcId, setVerificationCalcId] = useState("");
  const [verificationIsPublic, setVerificationIsPublic] = useState(true);
  const [verificationExpiresAt, setVerificationExpiresAt] = useState("");

  // ─── Server data ───────────────────────────────────────────────────────────

  const { data: projects = [], isLoading: projectsLoading } =
    trpc.projects.list.useQuery();

  const {
    data: shareLinks = [],
    isLoading: linksLoading,
    refetch: refetchLinks,
  } = trpc.sharing.listAll.useQuery();

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const createShareLinkMutation = trpc.sharing.createShareLink.useMutation({
    onSuccess: () => {
      toast.success("Share link created successfully");
      refetchLinks();
      setIsCreateOpen(false);
      // Reset form
      setSelectedProjectId("");
      setAccessLevel("view_only");
      setExpiresAt("");
      setMaxAccess("");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create share link");
    },
  });

  const revokeShareLinkMutation = trpc.sharing.revokeShareLink.useMutation({
    onSuccess: () => {
      toast.success("Share link revoked");
      refetchLinks();
      setRevokeTargetId(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to revoke share link");
    },
  });

  const createVerificationMutation = trpc.verification.createToken.useMutation({
    onSuccess: () => {
      toast.success("Verification link created successfully");
      setIsVerificationOpen(false);
      setVerificationCalcId("");
      setVerificationExpiresAt("");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to create verification link");
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Link copied to clipboard");
  };

  const handleCreateShareLink = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }

    createShareLinkMutation.mutate({
      projectId: parseInt(selectedProjectId),
      accessLevel,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxAccessCount: maxAccess ? parseInt(maxAccess) : undefined,
    });
  };

  const handleRevokeConfirm = () => {
    if (revokeTargetId) {
      revokeShareLinkMutation.mutate({ linkId: revokeTargetId });
    }
  };

  const handleCreateVerificationLink = () => {
    if (!verificationCalcId.trim()) {
      toast.error("Please enter a calculation ID");
      return;
    }

    createVerificationMutation.mutate({
      calculationResultId: verificationCalcId.trim(),
      isPublic: verificationIsPublic,
      expiresAt: verificationExpiresAt ? new Date(verificationExpiresAt) : undefined,
    });
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "view_only":  return "bg-blue-100 text-blue-800";
      case "comment":    return "bg-yellow-100 text-yellow-800";
      case "download":   return "bg-green-100 text-green-800";
      default:           return "bg-gray-100 text-gray-800";
    }
  };

  const activeLinks = shareLinks.filter((l) => l.isActive);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Sharing</h1>
          <p className="text-muted-foreground mt-1">Share projects with reviewers and clients</p>
        </div>

        {/* Create Share Link Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Share Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Share Link</DialogTitle>
              <DialogDescription>
                Generate a link to share a project with reviewers
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Project selector */}
              <div className="space-y-2">
                <Label htmlFor="project">Select Project *</Label>
                {projectsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading projects…
                  </div>
                ) : (
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Choose a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Access level */}
              <div className="space-y-2">
                <Label htmlFor="access-level">Access Level *</Label>
                <Select value={accessLevel} onValueChange={(v) => setAccessLevel(v as AccessLevel)}>
                  <SelectTrigger id="access-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view_only">View Only (Read-Only)</SelectItem>
                    <SelectItem value="comment">Comment (View + Comments)</SelectItem>
                    <SelectItem value="download">Download (View + Download)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Expiration */}
              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration (Optional)</Label>
                <Input
                  id="expiration"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              {/* Max access count */}
              <div className="space-y-2">
                <Label htmlFor="max-access">Max Access Count (Optional)</Label>
                <Input
                  id="max-access"
                  type="number"
                  placeholder="Leave blank for unlimited"
                  value={maxAccess}
                  onChange={(e) => setMaxAccess(e.target.value)}
                  min={1}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateShareLink}
                disabled={createShareLinkMutation.isPending || !selectedProjectId}
              >
                {createShareLinkMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Share Link"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Share Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Share Links</CardTitle>
          <CardDescription>
            {activeLinks.length} active share link{activeLinks.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : activeLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No active share links</p>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create your first share link
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        {projects.find((p) => p.id === link.projectId)?.name ?? `Project #${link.projectId}`}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAccessLevelColor(link.accessLevel)}>
                          {link.accessLevel === "view_only" && <Eye className="w-3 h-3 mr-1" />}
                          {link.accessLevel === "comment" && <Lock className="w-3 h-3 mr-1" />}
                          {link.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {link.createdAt ? new Date(link.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-sm">{link.accessCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.token, link.id)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {copiedId === link.id && (
                            <span className="text-xs text-green-600">Copied!</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRevokeTargetId(link.id)}
                            disabled={revokeShareLinkMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Portal */}
      <Card>
        <CardHeader>
          <CardTitle>Public Verification Portal</CardTitle>
          <CardDescription>
            Share calculation verification links with authorities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate public verification links that allow authorities to verify the integrity and
            authenticity of your calculations without requiring login.
          </p>

          <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Verification Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Verification Link</DialogTitle>
                <DialogDescription>
                  Generate a public link to verify a specific calculation result
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="calc-id">Calculation Result ID *</Label>
                  <Input
                    id="calc-id"
                    placeholder="e.g. calc_abc123..."
                    value={verificationCalcId}
                    onChange={(e) => setVerificationCalcId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this in Calculation History → View → Calculation ID
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verif-expires">Expiration (Optional)</Label>
                  <Input
                    id="verif-expires"
                    type="date"
                    value={verificationExpiresAt}
                    onChange={(e) => setVerificationExpiresAt(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateVerificationLink}
                  disabled={createVerificationMutation.isPending || !verificationCalcId.trim()}
                >
                  {createVerificationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create Verification Link"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog
        open={!!revokeTargetId}
        onOpenChange={(open) => { if (!open) setRevokeTargetId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Share Link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently deactivate the link. Anyone using it will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
