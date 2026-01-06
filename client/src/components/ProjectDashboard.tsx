import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, Plus, Trash2, FileText, Calendar, Building2, TrendingUp } from 'lucide-react';
import { occupancyData } from '@/lib/occupancyData';

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    address: '',
    occupancyCode: '',
    notes: ''
  });

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('buildingCodeProjects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('buildingCodeProjects', JSON.stringify(projects));
    }
  }, [projects]);

  const createProject = () => {
    if (!newProject.name || !newProject.occupancyCode) {
      return;
    }

    const occupancy = occupancyData.find(occ => occ.code === newProject.occupancyCode);
    
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      address: newProject.address,
      occupancyCode: newProject.occupancyCode,
      occupancyName: occupancy?.name || '',
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      checklistProgress: {
        foundation: 0,
        framing: 0,
        mechanical: 0,
        insulation: 0,
        drywall: 0,
        final: 0
      },
      notes: newProject.notes
    };

    setProjects([...projects, project]);
    setNewProject({ name: '', address: '', occupancyCode: '', notes: '' });
    setIsCreateDialogOpen(false);
  };

  const deleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
      // Update localStorage
      const updatedProjects = projects.filter(p => p.id !== id);
      if (updatedProjects.length === 0) {
        localStorage.removeItem('buildingCodeProjects');
      }
    }
  };

  const getOverallProgress = (project: Project) => {
    const phases = Object.values(project.checklistProgress);
    const total = phases.reduce((sum, val) => sum + val, 0);
    return Math.round(total / phases.length);
  };

  return (
    <div className="space-y-6">
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
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new building project to track compliance and inspection progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
              <div>
                <Label htmlFor="project-occupancy">Occupancy Type *</Label>
                <Select value={newProject.occupancyCode} onValueChange={(value) => setNewProject({ ...newProject, occupancyCode: value })}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select occupancy type" />
                  </SelectTrigger>
                  <SelectContent>
                    {occupancyData.map(occ => (
                      <SelectItem key={occ.id} value={occ.code}>
                        {occ.code} - {occ.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
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
              <Button onClick={createProject} disabled={!newProject.name || !newProject.occupancyCode} className="rounded-none">
                Create Project
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const overallProgress = getOverallProgress(project);
            
            return (
              <Card key={project.id} className="rounded-none border-border hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold mb-1">{project.name}</CardTitle>
                      <CardDescription className="text-xs">{project.address || 'No address specified'}</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteProject(project.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
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

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <p className="font-bold">{project.checklistProgress.foundation}%</p>
                      <p className="text-muted-foreground">Foundation</p>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <p className="font-bold">{project.checklistProgress.framing}%</p>
                      <p className="text-muted-foreground">Framing</p>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <p className="font-bold">{project.checklistProgress.mechanical}%</p>
                      <p className="text-muted-foreground">Mechanical</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="w-3 h-3" />
                    <span>Created {new Date(project.createdDate).toLocaleDateString()}</span>
                  </div>

                  <Button className="w-full rounded-none" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Open Project
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-none border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Projects</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Progress</p>
                  <p className="text-2xl font-bold">
                    {Math.round(projects.reduce((sum, p) => sum + getOverallProgress(p), 0) / projects.length)}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold">
                    {projects.filter(p => getOverallProgress(p) === 100).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-primary opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
