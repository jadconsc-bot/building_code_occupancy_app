/**
 * Project Sharing & Share Links Page
 * Phase 2D: Reviewer access and read-only share links
 *
 * SHARING-001: wired to live backend — sharingRouter + projectsRouter
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Eye, Lock, Download } from "lucide-react";
import { toast } from "sonner";

export default function ProjectSharing() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Form state for the create dialog
  const [formAccessLevel, setFormAccessLevel] = useState<"view_only" | "comment" | "download">("view_only");
  const [formExpiresAt, setFormExpiresAt] = useState<string>("");
  const [formMaxAccess, setFormMaxAccess] = useState<string>("");

  const { data: projectsData = [] } = trpc.projects.list.useQuery();

  const { data: shareLinksData = [], refetch: refetchLinks } =
    trpc.sharing.listShareLinks.useQuery(
      { projectId: selectedProjectId! },
      { enabled: selectedProjectId !== null },
    );

  const shareLinks = shareLinksData.filter((l) => l.isActive);

  const createShareLinkMutation = trpc.sharing.createShareLink.useMutation({
    onSuccess: () => {
      refetchLinks();
      setIsCreateOpen(false);
      setFormExpiresAt("");
      setFormMaxAccess("");
      setFormAccessLevel("view_only");
      toast.success("Share link created");
    },
    onError: (err) => toast.error("Failed to create link: " + err.message),
  });

  const deactivateLinkMutation = trpc.sharing.deactivateShareLink.useMutation({
    onSuccess: () => {
      refetchLinks();
      toast.success("Link deactivated");
    },
    onError: (err) => toast.error("Failed to deactivate: " + err.message),
  });

  const selectedProject = projectsData.find((p) => p.id === selectedProjectId);

  const handleCreateShareLink = () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    createShareLinkMutation.mutate({
      projectId: selectedProjectId,
      accessLevel: formAccessLevel,
      expiresAt: formExpiresAt ? new Date(formExpiresAt) : undefined,
      maxAccessCount: formMaxAccess ? parseInt(formMaxAccess, 10) : undefined,
    });
  };

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "view_only":  return "bg-blue-100 text-blue-800";
      case "comment":    return "bg-yellow-100 text-yellow-800";
      case "download":   return "bg-green-100 text-green-800";
      default:           return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (val: Date | string | null | undefined) => {
    if (!val) return "Never";
    const d = typeof val === "string" ? new Date(val) : val;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Sharing</h1>
          <p className="text-muted-foreground mt-1">Share projects with reviewers and clients</p>
        </div>
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
              <DialogDescription>Generate a link to share this project with reviewers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Select Project *</Label>
                <select
                  id="project"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  value={selectedProjectId ?? ""}
                  onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select a project…</option>
                  {projectsData.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-level">Access Level *</Label>
                <select
                  id="access-level"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  value={formAccessLevel}
                  onChange={(e) => setFormAccessLevel(e.target.value as typeof formAccessLevel)}
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
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-access">Max Access Count (Optional)</Label>
                <Input
                  id="max-access"
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited"
                  value={formMaxAccess}
                  onChange={(e) => setFormMaxAccess(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateShareLink}
                disabled={createShareLinkMutation.isPending || !selectedProjectId}
              >
                {createShareLinkMutation.isPending ? "Creating…" : "Create Share Link"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-sm font-medium">View links for:</Label>
        <select
          className="px-3 py-2 border border-input rounded-md bg-background text-sm w-64"
          value={selectedProjectId ?? ""}
          onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Choose a project…</option>
          {projectsData.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Share Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Share Links</CardTitle>
          <CardDescription>
            {selectedProject
              ? `${shareLinks.length} active link${shareLinks.length !== 1 ? "s" : ""} for ${selectedProject.name}`
              : "Select a project to view its share links"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedProjectId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Select a project to view and manage its share links.</p>
            </div>
          ) : shareLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No share links yet. Create one to share with clients.</p>
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
                    <TableHead>Shareable URL</TableHead>
                    <TableHead>Access Level</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shareLinks.map((link) => {
                    const shareUrl = `${window.location.origin}/shared/${link.token}`;
                    return (
                      <TableRow key={link.id}>
                        <TableCell className="font-mono text-xs max-w-xs truncate" title={shareUrl}>
                          {shareUrl}
                        </TableCell>
                        <TableCell>
                          <Badge className={getAccessLevelColor(link.accessLevel)}>
                            {link.accessLevel === "view_only" && <Eye className="w-3 h-3 mr-1" />}
                            {link.accessLevel === "comment" && <Lock className="w-3 h-3 mr-1" />}
                            {link.accessLevel === "download" && <Download className="w-3 h-3 mr-1" />}
                            {link.accessLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(link.createdAt)}</TableCell>
                        <TableCell className="text-sm">{formatDate(link.expiresAt)}</TableCell>
                        <TableCell className="text-sm">{link.accessCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Copy link"
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
                              className="text-destructive"
                              title="Deactivate link"
                              onClick={() => deactivateLinkMutation.mutate({ linkId: link.id })}
                              disabled={deactivateLinkMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
