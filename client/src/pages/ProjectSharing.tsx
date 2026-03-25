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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, Trash2, Eye, Lock } from "lucide-react";
import { toast } from "sonner";

export default function ProjectSharing() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const revokeShareLinkMutation = trpc.sharing.revokeShareLink.useMutation();

  const [shareLinks, setShareLinks] = useState([
    {
      id: "link-1",
      projectName: "Downtown Office Tower",
      token: "abc123def456",
      accessLevel: "view_only",
      createdAt: "2026-03-01",
      expiresAt: "2026-04-01",
      accessCount: 5,
      isActive: true,
    },
    {
      id: "link-2",
      projectName: "Residential Complex",
      token: "xyz789uvw012",
      accessLevel: "comment",
      createdAt: "2026-02-28",
      expiresAt: null,
      accessCount: 12,
      isActive: true,
    },
  ]);

  const copyToClipboard = (token: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteShareLink = async (linkId: string) => {
    setIsDeleting(linkId);
    try {
      await revokeShareLinkMutation.mutateAsync({ linkId });
      setShareLinks(prev => prev.filter(link => link.id !== linkId));
      toast.success("Share link revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke share link");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateShareLink = async () => {
    try {
      // TODO: Wire to tRPC mutation for creating share link
      // const result = await trpc.sharing.createShareLink.mutate({ ... });
      
      toast.success("Share link created successfully");
      setIsCreateOpen(false);
    } catch (error) {
      toast.error("Failed to create share link");
    }
  };

  const handleCreateVerificationLink = async () => {
    try {
      // TODO: Wire to tRPC mutation for creating verification link
      // const result = await trpc.verification.createVerificationLink.mutate({ ... });
      
      toast.success("Verification link created successfully");
    } catch (error) {
      toast.error("Failed to create verification link");
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
                <Input id="project" placeholder="Choose a project" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access-level">Access Level *</Label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option value="view_only">View Only (Read-Only)</option>
                  <option value="comment">Comment (View + Comments)</option>
                  <option value="download">Download (View + Download)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration (Optional)</Label>
                <Input id="expiration" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-access">Max Access Count (Optional)</Label>
                <Input id="max-access" type="number" placeholder="Leave blank for unlimited" />
              </div>

              <Button className="w-full" onClick={handleCreateShareLink}>Create Share Link</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Share Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Share Links</CardTitle>
          <CardDescription>{shareLinks.length} share link{shareLinks.length !== 1 ? "s" : ""} created</CardDescription>
        </CardHeader>
        <CardContent>
          {shareLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No share links yet</p>
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
                  {shareLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">{link.projectName}</TableCell>
                      <TableCell>
                        <Badge className={getAccessLevelColor(link.accessLevel)}>
                          {link.accessLevel === "view_only" && <Eye className="w-3 h-3 mr-1" />}
                          {link.accessLevel === "comment" && <Lock className="w-3 h-3 mr-1" />}
                          {link.accessLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{link.createdAt}</TableCell>
                      <TableCell className="text-sm">
                        {link.expiresAt ? link.expiresAt : "Never"}
                      </TableCell>
                      <TableCell className="text-sm">{link.accessCount}</TableCell>
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
                            className="text-destructive"
                            onClick={() => handleDeleteShareLink(link.id)}
                            disabled={isDeleting === link.id}
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
          <Button variant="outline" className="gap-2" onClick={handleCreateVerificationLink}>
            <Plus className="w-4 h-4" />
            Create Verification Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
