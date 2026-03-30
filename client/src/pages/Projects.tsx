/**
 * Projects Management Page
 * Phase 2A: Professional project management with team collaboration
 * FULLY INTEGRATED WITH tRPC MUTATIONS AND OPTIMISTIC UI UPDATES
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search, Loader2, Users, FileText, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ProjectComplianceCard } from "@/components/ProjectComplianceCard";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    occupancyCode: "",
    template: "",
    notes: "",
    status: "active",
  });

  // Fetch projects using tRPC - using a placeholder query since we need to create it
  const { data: projects = [], isLoading, refetch } = trpc.projects.list.useQuery();

  // Create project mutation with optimistic UI
  const createProjectMutation = trpc.projects.create.useMutation({
    onMutate: async (newProject) => {
      await trpc.useUtils().projects.list.cancel();
      const previousProjects = trpc.useUtils().projects.list.getData();

      trpc.useUtils().projects.list.setData(undefined, (old) => [
        ...(old || []),
        { ...newProject, id: Date.now(), createdAt: new Date(), updatedAt: new Date() } as any,
      ]);

      return { previousProjects };
    },
    onError: (err, newProject, context) => {
      if (context?.previousProjects) {
        trpc.useUtils().projects.list.setData(undefined, context.previousProjects);
      }
      alert("Failed to create project: " + err.message);
    },
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
      resetForm();
    },
  });

  // Update project mutation with optimistic UI
  const updateProjectMutation = trpc.projects.update.useMutation({
    onMutate: async (updatedProject) => {
      await trpc.useUtils().projects.list.cancel();
      const previousProjects = trpc.useUtils().projects.list.getData();

      trpc.useUtils().projects.list.setData(undefined, (old) =>
        old?.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p))
      );

      return { previousProjects };
    },
    onError: (err, updatedProject, context) => {
      if (context?.previousProjects) {
        trpc.useUtils().projects.list.setData(undefined, context.previousProjects);
      }
      alert("Failed to update project: " + err.message);
    },
    onSuccess: () => {
      refetch();
      setIsEditOpen(false);
      resetForm();
    },
  });

  // Delete project mutation with optimistic UI
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onMutate: async (input: { id: number }) => {
      await trpc.useUtils().projects.list.cancel();
      const previousProjects = trpc.useUtils().projects.list.getData();

      trpc.useUtils().projects.list.setData(undefined, (old) =>
        old?.filter((p) => p.id !== input.id)
      );

      return { previousProjects };
    },
    onError: (err, projectId, context) => {
      if (context?.previousProjects) {
        trpc.useUtils().projects.list.setData(undefined, context.previousProjects);
      }
      alert("Failed to delete project: " + err.message);
    },
    onSuccess: () => {
      refetch();
    },
  });

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.address?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      occupancyCode: "",
      template: "",
      notes: "",
      status: "active",
    });
    setEditingProjectId(null);
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      alert("Project name is required");
      return;
    }
    if (!formData.occupancyCode.trim()) {
      alert("Occupancy code is required");
      return;
    }

    await createProjectMutation.mutateAsync({
      name: formData.name,
      occupancyCode: formData.occupancyCode,
      description: formData.notes || undefined,
    });
  };

  const handleEditProject = (project: any) => {
    setFormData({
      name: project.name,
      address: project.address || "",
      occupancyCode: project.occupancyCode || "",
      template: project.template || "",
      notes: project.notes || "",
      status: project.status || "active",
    });
    setEditingProjectId(project.id);
    setIsEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!formData.name.trim()) {
      alert("Project name is required");
      return;
    }
    if (!formData.occupancyCode.trim()) {
      alert("Occupancy code is required");
      return;
    }

    if (editingProjectId !== null) {
      await updateProjectMutation.mutateAsync({
        id: editingProjectId,
        name: formData.name,
        occupancyCode: formData.occupancyCode,
        description: formData.notes || undefined,
      });
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await deleteProjectMutation.mutateAsync({ id: projectId });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Create and manage building code compliance projects</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Start a new building code compliance project</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Downtown Office Tower Renovation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occupancyCode">Occupancy Code *</Label>
                <Input
                  id="occupancyCode"
                  placeholder="A, B, C, D, E, F, etc."
                  value={formData.occupancyCode}
                  onChange={(e) => setFormData({ ...formData, occupancyCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template (Optional)</Label>
                <Input
                  id="template"
                  placeholder="e.g., residential, commercial"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Project details and scope"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by project name, address, or description..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Downtown Office Tower Renovation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-occupancyCode">Occupancy Code *</Label>
              <Input
                id="edit-occupancyCode"
                placeholder="A, B, C, D, E, F, etc."
                value={formData.occupancyCode}
                onChange={(e) => setFormData({ ...formData, occupancyCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                placeholder="Street address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-template">Template (Optional)</Label>
              <Input
                id="edit-template"
                placeholder="e.g., residential, commercial"
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Project details and scope"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleUpdateProject}
              disabled={updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Projects Grid - Modernized with Compliance Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No projects found</p>
              <Button
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <div key={project.id} className="flex items-center gap-2">
              <div className="flex-1">
                <ProjectComplianceCard
                  id={project.id.toString()}
                  name={project.name}
                  address={project.address || "No address"}
                  status={(project.status === "active" ? "PASS" : "IN_REVIEW") as any}
                  findingsCount={0}
                  lastModified={new Date(project.createdAt)}
                  onClick={() => setLocation(`/project/${project.id}`)}
                  isLoading={false}
                />
              </div>
              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(project);
                  }}
                  disabled={updateProjectMutation.isPending}
                  title="Edit project"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id);
                  }}
                  disabled={deleteProjectMutation.isPending}
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
