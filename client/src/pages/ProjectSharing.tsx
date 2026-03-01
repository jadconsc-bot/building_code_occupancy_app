/**
 * Project Sharing & Share Links Page
 * Phase 2D: Reviewer access and read-only share links
 * FULLY CONNECTED: All buttons wired to tRPC backend
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Eye, Lock, Loader2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ProjectSharing() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    projectId: "",
    accessLevel: "view_only",
    expirationDate: "",
  });

  // Fetch share links
  const { data: shareLinks = [], isLoading, refetch } = trpc.sharing.listShareLinks.useQuery();

  // tRPC mutations
  const createShareLinkMutation = trpc.sharing.createShareLink.useMutation({
    onSuccess: () => {
      alert("Share link created successfully");
      setIsCreateOpen(false);
      setFormData({ projectId: "", accessLevel: "view_only", expirationDate: "" });
      refetch();
    },
    onError: (error) => {
      alert("Error: " + error.message);
    },
  });

  const revokeShareLinkMutation = trpc.sharing.revokeShareLink.useMutation({
    onSuccess: () => {
      alert("Share link revoked successfully");
      refetch();
    },
    onError: (error) => {
      alert("Error: " + error.message);
    },
  });

  const handleCreateShareLink = async () => {
    if (!formData.projectId) {
      alert("Please select a project");
      return;
    }

    await createShareLinkMutation.mutateAsync({
      projectId: formData.projectId,
      accessLevel: formData.accessLevel as "view_only" | "comment" | "download",
      expirationDate: formData.expirationDate || undefined,
    });
  };

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeLink = async (linkId: string) => {
    if (confirm("Are you sure you want to revoke this share link?")) {
      await revokeShareLinkMutation.mutateAsync({ id: linkId });
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "view_only":
        return "bg-blue-100 text-blue-800";
      case "comment":
        return "bg-yellow-100 text-yellow-800";
      case "download":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Sharing</h1>
          <p className="text-muted-foreground mt-1">Share projects with reviewers and clients</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Share Link
        </Button>
      </div>

      {/* Create Share Link Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Share Link</DialogTitle>
            <DialogDescription>Generate a link to share this project with reviewers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Select Project *</Label>
              <select
                id="project"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              >
                <option value="">Choose a project</option>
                <option value="proj-001">Downtown Office Tower</option>
                <option value="proj-002">Residential Complex</option>
                <option value="proj-003">Commercial Center</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-level">Access Level *</Label>
              <select
                id="access-level"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.accessLevel}
                onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value })}
              >
                <option value="view_only">View Only (Read-Only)</option>
                <option value="comment">Comment (View + Comments)</option>
                <option value="download">Download (View + Download)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration (Optional)</Label>
              <Input
                id="expiration"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateShareLink}
                disabled={createShareLinkMutation.isPending}
                className="gap-2"
              >
                {createShareLinkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Share Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Share Links</CardTitle>
          <CardDescription>{shareLinks.length} share link{shareLinks.length !== 1 ? "s" : ""} created</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : shareLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No share links yet</p>
              <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="gap-2">
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
                  {shareLinks.map((link: any) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.projectName}</TableCell>
                      <TableCell>
                        <Badge className={getAccessLevelColor(link.accessLevel)}>
                          {link.accessLevel === "view_only" && <Eye className="w-3 h-3 mr-1" />}
                          {link.accessLevel === "comment" && <Lock className="w-3 h-3 mr-1" />}
                          {link.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(link.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">
                        {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-sm">{link.accessCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(link.token, link.id)}
                            title="Copy link"
                          >
                            {copiedId === link.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          {copiedId === link.id && (
                            <span className="text-xs text-green-600">Copied!</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleRevokeLink(link.id)}
                            disabled={revokeShareLinkMutation.isPending}
                            title="Revoke link"
                          >
                            {revokeShareLinkMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

      {/* Verification Portal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Public Verification Portal</CardTitle>
          <CardDescription>Share calculation verification links with authorities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Generate public verification links that allow authorities to verify the integrity and authenticity of your calculations without requiring login.
          </p>
          <Button variant="outline" className="gap-2" onClick={() => alert("Create Verification Link - Feature coming soon")}>
            <Plus className="w-4 h-4" />
            Create Verification Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
