import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/components/ProjectDashboard';
import { ConstructionPhase } from '@/lib/inspectorChecklistData';

interface ProjectContextType {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  updateProjectProgress: (projectId: string, phase: ConstructionPhase, percentage: number) => void;
  getProject: (id: string) => Project | undefined;
  getAllProjects: () => Project[];
  saveProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  exportProject: (id: string) => string | null;
  importProject: (jsonData: string) => boolean;
  exportAllProjects: () => string;
  importAllProjects: (jsonData: string) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load projects from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('buildingCodeProjects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }

    const savedActiveProject = localStorage.getItem('activeProjectId');
    if (savedActiveProject) {
      setActiveProjectId(savedActiveProject);
    }
  }, []);

  // Save active project ID to localStorage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('activeProjectId', activeProjectId);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  }, [activeProjectId]);

  const updateProjectProgress = (projectId: string, phase: ConstructionPhase, percentage: number) => {
    const savedProjects = localStorage.getItem('buildingCodeProjects');
    if (!savedProjects) return;

    const projectsList: Project[] = JSON.parse(savedProjects);
    const projectIndex = projectsList.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) return;

    // Map phase names to lowercase keys
    const phaseKey = phase.toLowerCase().replace(/\s+&\s+/g, '') as keyof Project['checklistProgress'];
    
    projectsList[projectIndex].checklistProgress[phaseKey] = percentage;
    projectsList[projectIndex].lastModified = new Date().toISOString();

    localStorage.setItem('buildingCodeProjects', JSON.stringify(projectsList));
    setProjects(projectsList);
  };

  const getProject = (id: string): Project | undefined => {
    return projects.find(p => p.id === id);
  };

  const getAllProjects = (): Project[] => {
    return projects;
  };

  const saveProject = (project: Project) => {
    const projectsList = [...projects];
    const existingIndex = projectsList.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projectsList[existingIndex] = { ...project, lastModified: new Date().toISOString() };
    } else {
      projectsList.push({ ...project, lastModified: new Date().toISOString() });
    }
    
    localStorage.setItem('buildingCodeProjects', JSON.stringify(projectsList));
    setProjects(projectsList);
  };

  const deleteProject = (id: string) => {
    const projectsList = projects.filter(p => p.id !== id);
    localStorage.setItem('buildingCodeProjects', JSON.stringify(projectsList));
    setProjects(projectsList);
    
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const exportProject = (id: string): string | null => {
    const project = projects.find(p => p.id === id);
    if (!project) return null;
    
    return JSON.stringify(project, null, 2);
  };

  const importProject = (jsonData: string): boolean => {
    try {
      const project: Project = JSON.parse(jsonData);
      
      // Validate required fields
      if (!project.id || !project.name || !project.address) {
        return false;
      }
      
      saveProject(project);
      return true;
    } catch (error) {
      console.error('Failed to import project:', error);
      return false;
    }
  };

  const exportAllProjects = (): string => {
    return JSON.stringify(projects, null, 2);
  };

  const importAllProjects = (jsonData: string): boolean => {
    try {
      const importedProjects: Project[] = JSON.parse(jsonData);
      
      // Validate it's an array
      if (!Array.isArray(importedProjects)) {
        return false;
      }
      
      // Merge with existing projects (avoid duplicates by ID)
      const mergedProjects = [...projects];
      importedProjects.forEach(importedProject => {
        const existingIndex = mergedProjects.findIndex(p => p.id === importedProject.id);
        if (existingIndex >= 0) {
          mergedProjects[existingIndex] = importedProject;
        } else {
          mergedProjects.push(importedProject);
        }
      });
      
      localStorage.setItem('buildingCodeProjects', JSON.stringify(mergedProjects));
      setProjects(mergedProjects);
      return true;
    } catch (error) {
      console.error('Failed to import projects:', error);
      return false;
    }
  };

  return (
    <ProjectContext.Provider value={{
      activeProjectId,
      setActiveProjectId,
      updateProjectProgress,
      getProject,
      getAllProjects,
      saveProject,
      deleteProject,
      exportProject,
      importProject,
      exportAllProjects,
      importAllProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
