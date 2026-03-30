import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@/components/ProjectDashboard';
import { ConstructionPhase } from '@/lib/inspectorChecklistData';
import { trpc } from '@/lib/trpc';
import { occupancyData } from '@/lib/occupancyData';

interface ProjectContextType {
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  updateProjectProgress: (projectId: number, phase: ConstructionPhase, percentage: number) => void;
  getProject: (id: number) => Project | undefined;
  getAllProjects: () => Project[];
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(() => {
    const saved = localStorage.getItem('activeProjectId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch projects from database
  const { data: dbProjects = [], isLoading: dbLoading } = trpc.projects.list.useQuery();

  // Sync database projects to state
  useEffect(() => {
    setIsLoading(dbLoading);
    if (dbProjects && dbProjects.length > 0) {
      // Convert database projects to local Project format
      const convertedProjects: Project[] = dbProjects.map((dbProject) => {
        const occupancy = occupancyData.find((o) => o.code === dbProject.occupancyCode);
        return {
          id: dbProject.id.toString(),
          name: dbProject.name,
          address: dbProject.address || '',
          occupancyCode: dbProject.occupancyCode,
          occupancyName: occupancy?.name || dbProject.occupancyCode,
          createdDate: dbProject.createdAt.toISOString(),
          lastModified: dbProject.updatedAt.toISOString(),
          checklistProgress: {
            foundation: 0,
            framing: 0,
            mechanical: 0,
            insulation: 0,
            drywall: 0,
            final: 0,
          },
          notes: dbProject.notes || '',
        };
      });
      setProjects(convertedProjects);
    }
  }, [dbProjects, dbLoading]);

  // Save active project ID to localStorage
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('activeProjectId', activeProjectId.toString());
    } else {
      localStorage.removeItem('activeProjectId');
    }
  }, [activeProjectId]);

  const updateProjectProgress = (projectId: number, phase: ConstructionPhase, percentage: number) => {
    // Update local state
    const projectIndex = projects.findIndex(p => p.id === projectId.toString());
    if (projectIndex === -1) return;

    const phaseKey = phase.toLowerCase().replace(/\s+&\s+/g, '') as keyof Project['checklistProgress'];
    const updatedProjects = [...projects];
    updatedProjects[projectIndex].checklistProgress[phaseKey] = percentage;
    updatedProjects[projectIndex].lastModified = new Date().toISOString();

    setProjects(updatedProjects);
  };

  const getProject = (id: number): Project | undefined => {
    return projects.find(p => p.id === id.toString());
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
      getAllProjects,
      isLoading,
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

// Type for database projects
export type DatabaseProject = {
  id: number;
  userId: number;
  name: string;
  address?: string | null;
  occupancyCode: string;
  template?: string | null;
  notes?: string | null;
  status: 'active' | 'completed' | 'archived';
  overallProgress: number;
  createdAt: Date;
  updatedAt: Date;
};
