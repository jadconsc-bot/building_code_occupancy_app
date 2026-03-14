'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Plus, Trash2, Building2, TrendingUp } from 'lucide-react';
import { occupancyData } from '@/lib/occupancyData';
import { projectTemplates } from '@/lib/projectTemplates';
import { trpc } from '@/lib/trpc';
import { useProject } from '@/contexts/ProjectContext';
import { toast } from 'sonner';

export interface Project {
  id: string;
  name: string;
  address: string;
  occupancyCode: string;
  occupancyName: string;
  createdDate: string;
  lastModified: string;
  checklistProgress: {
    foundation: number;
    framing: number;
    mechanical: number;
    insulation: number;
    drywall: number;
    final: number;
  };
  notes: string;
}

export function ProjectDashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    address: '',
    occupancyCode: '',
    notes: '',
    templateId: ''
  });

  // Get projects from ProjectContext (synced from database)
  const { getAllProjects, setActiveProjectId } = useProject();
  const projects = getAllProjects();

  // Create project mutation
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (dbProject) => {
      toast.success('Project created successfully');
      setIsCreateDialogOpen(false);
      setNewProject({ name: '', address: '', occupancyCode: '', notes: '', templateId: '' });
      setActiveProjectId(parseInt(dbProject.id.toString()));
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });

  // Delete project mutation
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete project: ' + error.message);
    },
  });

  const handleCreateProject = async () => {
    if (!newProject.name || !newProject.occupancyCode) {
      toast.error('Please fill in required fields');
      return;
    }

    await createProjectMutation.mutateAsync({
      name: newProject.name,
      description: newProject.address || '',
      occupancyCode: newProject.occupancyCode,
      buildingType: newProject.occupancyCode,
    });
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      const numId = parseInt(id);
      deleteProjectMutation.mutate({ id: numId });
    }
  };

  const getOverallProgress = (project: Project) => {
    const phases = Object.values(project.checklistProgress);
    const total = phases.reduce((sum, val) => sum + val, 0);
    return Math.round(total / phases.length);
  };

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Dashboard</h2>
          <p className="text-muted-foreground">Manage and track your building code compliance projects</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new building project to track compliance and inspection progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div>
                <Label htmlFor="project-name">Project Name *</Label>
                <Input
                  id="project-name"
                  placeholder="e.g., Riverside Apartments"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="project-address">Address</Label>
                <Input
                  id="project-address"
                  placeholder="e.g., 123 Main St, Calgary, AB"
                  value={newProject.address}
                  onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                  className="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupancy">Occupancy Type *</Label>
                <Select
                  value={newProject.occupancyCode}
                  onValueChange={(value) => setNewProject({ ...newProject, occupancyCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select occupancy" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupancyData.map((occ) => (
                      <SelectItem key={occ.code} value={occ.code}>
                        {occ.code} - {occ.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template">Project Template (Optional)</Label>
                <Select
                  value={newProject.templateId}
                  onValueChange={(value) => setNewProject({ ...newProject, templateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start from scratch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template (blank project)</SelectItem>
                    {projectTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Templates include pre-configured inspection checklists and typical requirements
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-notes">Notes</Label>
                <Input
                  id="project-notes"
                  placeholder="Optional project notes"
                  value={newProject.notes}
                  onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-none">
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProject} 
                disabled={!newProject.name || !newProject.occupancyCode || createProjectMutation.isPending}
                className="rounded-none"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="rounded-none border-border">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first project to start tracking building code compliance</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-none">
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          {projects.map(project => {
            const overallProgress = getOverallProgress(project);
            
            return (
              <Card key={project.id} className="rounded-none border-border hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="overflow-y-auto">
                  <div className="flex items-start justify-between overflow-hidden">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold mb-1">{project.name}</CardTitle>
                      <CardDescription className="text-xs">{project.address || 'No address specified'}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                      disabled={deleteProjectMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 overflow-y-auto max-h-[300px]">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      {project.occupancyCode}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{project.occupancyName}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
                      <span className="text-lg font-bold text-primary">{overallProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Created: {new Date(project.createdDate).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
