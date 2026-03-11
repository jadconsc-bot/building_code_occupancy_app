import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { ProjectChecklistDashboard } from '@/components/ProjectChecklistDashboard';
import { ProjectManager } from '@/components/ProjectManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus } from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function ProjectChecklistsPage() {
  const { user, loading } = useAuth();
  const { activeProjectId, setActiveProjectId, getAllProjects, isLoading: projectsLoading } = useProject();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    occupancyCode: '',
  });
  const projects = getAllProjects();

  // Create project mutation
  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (newProject) => {
      toast.success('Project created successfully');
      setIsCreateOpen(false);
      setFormData({ name: '', occupancyCode: '' });
      setActiveProjectId(newProject.id);
    },
    onError: (error) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });

  const handleCreateProject = async () => {
    if (!formData.name.trim() || !formData.occupancyCode.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    await createProjectMutation.mutateAsync({
      name: formData.name,
      occupancyCode: formData.occupancyCode,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to view project checklists</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/')}
                className="h-8 w-8"
              >
                <ArrowLeft size={16} />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Project Checklists</h1>
                <p className="text-sm text-muted-foreground">
                  Manage and track inspection checklists for your projects
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Project Selection */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Projects</CardTitle>
                <CardDescription>Select a project to view checklists</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {projects && projects.length > 0 ? (
                  <div className="space-y-2">
                    {projects.map((project: any) => (
                      <Button
                        key={project.id}
                        variant={activeProjectId === parseInt(project.id) ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => {
                          setActiveProjectId(parseInt(project.id));
                        }}
                      >
                        <div className="truncate">
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description || 'No description'}
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                )}

                <Button 
                  variant="outline" 
                  className="w-full gap-2 mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={16} />
                  New Project
                </Button>

                {/* Create Project Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>Add a new building code compliance project</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name *</Label>
                        <Input
                          id="project-name"
                          placeholder="e.g., Downtown Office Tower"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="occupancy-code">Occupancy Code *</Label>
                        <Input
                          id="occupancy-code"
                          placeholder="e.g., A, B, C, D, E, F"
                          value={formData.occupancyCode}
                          onChange={(e) => setFormData({ ...formData, occupancyCode: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateProject}
                          disabled={createProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Checklist Dashboard */}
          <div className="lg:col-span-3">
            {activeProjectId ? (
              <ProjectChecklistDashboard />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="space-y-4">
                    <div className="text-5xl">📋</div>
                    <h3 className="text-lg font-semibold">No Project Selected</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Select a project from the sidebar to view and manage its checklists. Create a new project to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
