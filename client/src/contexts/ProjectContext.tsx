import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/components/ProjectDashboard';
import { ConstructionPhase } from '@/lib/inspectorChecklistData';

interface ProjectContextType {
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  updateProjectProgress: (projectId: string, phase: ConstructionPhase, percentage: number) => void;
  getProject: (id: string) => Project | undefined;
  getAllProjects: () => Project[];
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

  return (
    <ProjectContext.Provider value={{
      activeProjectId,
      setActiveProjectId,
      updateProjectProgress,
      getProject,
      getAllProjects
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
