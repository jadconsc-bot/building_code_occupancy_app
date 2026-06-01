import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Archive, CheckCircle2, AlertCircle } from "lucide-react";
import { occupancyData } from "@/lib/occupancyData";

interface ProjectManagerProps {
  onProjectSelect?: (projectId: number) => void;
  activeProjectId?: number;
}

export function ProjectManager({ onProjectSelect, activeProjectId }: ProjectManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    occupancyCode: "C",
    template: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      utils.projects.list.invalidate();
      setIsCreateDialogOpen(false);
      setFormData({ name: "", address: "", occupancyCode: "C", template: "", notes: "" });
      if (onProjectSelect) {
        onProjectSelect(data.id);
      }
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
    },
  });

  const handleCreateProject = () => {
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      occupancyCode: formData.occupancyCode,
      description: formData.notes || undefined,
    });
  };

  const handleDeleteProject = (projectId: number) => {
    if (confirm("Are you sure you want to delete this project? This cannot be undone.")) {
      deleteMutation.mutate({ id: projectId });
    }
  };

  const getOccupancyLabel = (code: string) => {
    const occupancy = occupancyData.find((o) => o.code === code);
    return occupancy ? `${code} - ${occupancy.name}` : code;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new building code compliance project. You can link calculators and checklists to this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Downtown Office Building"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="project-address">Address</Label>
                <Input
                  id="project-address"
                  placeholder="e.g., 123 Main St, Calgary, AB"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="occupancy-code">Occupancy Classification *</Label>
                <select
                  id="occupancy-code"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={formData.occupancyCode}
                  onChange={(e) => setFormData({ ...formData, occupancyCode: e.target.value })}
                >
                  {occupancyData.map((occ) => (
                    <option key={occ.code} value={occ.code}>
                      {occ.code} - {occ.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="template">Project Template (Optional)</Label>
                <select
                  id="template"
                  className="w-full px-3 py-2 border border-input rounded-md"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>
              <div>
                <Label htmlFor="project-notes">Notes</Label>
                <Textarea
                  id="project-notes"
                  placeholder="Add any additional notes about this project..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No projects yet. Create your first project to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={`cursor-pointer transition-all ${activeProjectId === project.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => onProjectSelect?.(project.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>{getOccupancyLabel(project.occupancyCode)}</CardDescription>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.address && <p className="text-sm text-muted-foreground">{project.address}</p>}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{project.overallProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${project.overallProgress}%` }}
                    />
                  </div>
                </div>

                {project.notes && <p className="text-xs text-muted-foreground italic">{project.notes}</p>}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectSelect?.(project.id);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
