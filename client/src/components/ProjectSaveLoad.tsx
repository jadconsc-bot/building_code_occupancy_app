import { useState, useRef } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Save, FolderOpen, FileJson } from 'lucide-react';


export function ProjectSaveLoad() {
  const { 
    activeProjectId, 
    getProject, 
    getAllProjects,
    exportProject, 
    importProject, 
    exportAllProjects, 
    importAllProjects 
  } = useProject();
  

  const fileInputRef = useRef<HTMLInputElement>(null);
  const allProjectsInputRef = useRef<HTMLInputElement>(null);

  const handleExportProject = () => {
    if (!activeProjectId) {
      alert("Please select a project first.");
      return;
    }

    const jsonData = exportProject(activeProjectId);
    if (!jsonData) {
      alert("Could not export project.");
      return;
    }

    const project = getProject(activeProjectId);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project?.name || 'project'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`${project?.name} has been exported successfully.`);
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importProject(content);
      
      if (success) {
        alert("Project has been imported successfully.");
      } else {
        alert("Invalid project file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportAllProjects = () => {
    const projects = getAllProjects();
    if (projects.length === 0) {
      alert("There are no projects to export.");
      return;
    }

    const jsonData = exportAllProjects();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_projects_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`${projects.length} project(s) exported successfully.`);
  };

  const handleImportAllProjects = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importAllProjects(content);
      
      if (success) {
        alert("Projects have been imported successfully.");
      } else {
        alert("Invalid projects file format.");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (allProjectsInputRef.current) {
      allProjectsInputRef.current.value = '';
    }
  };

  return (
    <Card className="rounded-none border-border shadow-sm">
      <CardHeader className="pb-2 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Save className="w-4 h-4" /> Project Management
        </CardTitle>
        <CardDescription>
          Save, load, export, and import your building code projects
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Project Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Current Project
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleExportProject}
                disabled={!activeProjectId}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Download className="w-4 h-4" />
                Export Project as JSON
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <Upload className="w-4 h-4" />
                Import Project from JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportProject}
                className="hidden"
              />
            </div>
          </div>

          {/* All Projects Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              All Projects
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleExportAllProjects}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <FileJson className="w-4 h-4" />
                Export All Projects
              </Button>
              <Button
                onClick={() => allProjectsInputRef.current?.click()}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Import Projects
              </Button>
              <input
                ref={allProjectsInputRef}
                type="file"
                accept=".json"
                onChange={handleImportAllProjects}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/30 border border-border rounded">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            💡 Tips
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Projects are automatically saved to your browser's local storage</li>
            <li>Export projects as JSON files to back them up or share with team members</li>
            <li>Import JSON files to restore projects or transfer between devices</li>
            <li>Importing projects with duplicate IDs will update existing projects</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
