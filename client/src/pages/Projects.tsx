/**
 * Projects Management Page
 * Phase 2A: Professional project management with team collaboration
 * FULLY INTEGRATED WITH tRPC MUTATIONS AND OPTIMISTIC UI UPDATES
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit2, Trash2, Search, Loader2, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { ProjectComplianceCard } from "@/components/ProjectComplianceCard";
import { ProjectWizard } from "@/components/ProjectWizard";

export default function Projects() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    address: "",
    occupancyCode: "",
    template: "",
    notes: "",
  });

  const { data: projects = [], isLoading, refetch } = trpc.projects.list.useQuery();

  const updateProjectMutation = trpc.projects.update.useMutation({
    onMutate: async (updatedProject) => {
      await trpc.useUtils().projects.list.cancel();
      const previousProjects = trpc.useUtils().projects.list.getData();
      trpc.useUtils().projects.list.setData(undefined, (old) =>
        (old?.map((p) => (p.id === updatedProject.id ? { ...p, ...updatedProject } : p)) ?? old) as typeof old
      );
      return { previousProjects };
    },
    onError: (err, _updated, context) => {
      if (context?.previousProjects) {
        trpc.useUtils().projects.list.setData(undefined, context.previousProjects);
      }
      alert("Failed to update project: " + err.message);
    },
    onSuccess: () => {
      refetch();
      setIsEditOpen(false);
      resetEditForm();
    },
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onMutate: async (input: { id: number }) => {
      await trpc.useUtils().projects.list.cancel();
      const previousProjects = trpc.useUtils().projects.list.getData();
      trpc.useUtils().projects.list.setData(undefined, (old) =>
        old?.filter((p) => p.id !== input.id)
      );
      return { previousProjects };
    },
    onError: (err, _input, context) => {
      if (context?.previousProjects) {
        trpc.useUtils().projects.list.setData(undefined, context.previousProjects);
      }
      alert("Failed to delete project: " + err.message);
    },
    onSuccess: () => refetch(),
  });

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.projectCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.projectNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [projects, searchQuery]
  );

  function resetEditForm() {
    setEditFormData({ name: "", address: "", occupancyCode: "", template: "", notes: "" });
    setEditingProjectId(null);
  }

  function handleEditProject(project: any) {
    setEditFormData({
      name: project.name,
      address: project.address || "",
      occupancyCode: project.occupancyCode || "",
      template: project.template || "",
      notes: project.notes || "",
    });
    setEditingProjectId(project.id);
    setIsEditOpen(true);
  }

  async function handleUpdateProject() {
    if (!editFormData.name.trim()) { alert("Project name is required"); return; }
    if (!editFormData.occupancyCode.trim()) { alert("Occupancy code is required"); return; }
    if (editingProjectId !== null) {
      await updateProjectMutation.mutateAsync({
        id: editingProjectId,
        name: editFormData.name,
        occupancyCode: editFormData.occupancyCode,
        address: editFormData.address || undefined,
        description: editFormData.notes || undefined,
      });
    }
  }

  async function handleDeleteProject(projectId: number) {
    if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      await deleteProjectMutation.mutateAsync({ id: projectId });
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">Create and manage building code compliance projects</p>
        </div>
        <Button className="gap-2" onClick={() => setIsWizardOpen(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Wizard */}
      <ProjectWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSuccess={(id) => {
          refetch();
          setLocation(`/project/${id}`);
        }}
      />

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by project name, address, or description..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-occupancyCode">Occupancy Code *</Label>
              <Input
                id="edit-occupancyCode"
                placeholder="A, B, C, D, E, F, etc."
                value={editFormData.occupancyCode}
                onChange={(e) => setEditFormData({ ...editFormData, occupancyCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
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

      {/* Projects list */}
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
              <Button variant="outline" onClick={() => setIsWizardOpen(true)} className="gap-2">
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
                  projectCode={project.projectCode ?? undefined}
                  projectNumber={project.projectNumber ?? undefined}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                  disabled={updateProjectMutation.isPending}
                  title="Edit project"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
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
