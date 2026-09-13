import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useProject } from '@/contexts/ProjectContext';
import { FileText, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BriefPage() {
  const [, navigate] = useLocation();
  const { activeProjectId, setActiveProjectId } = useProject();
  const projectsQuery = trpc.projects.list.useQuery();
  const [redirectCancelled, setRedirectCancelled] = useState(false);

  // Path A: active project known — redirect immediately
  useEffect(() => {
    if (!activeProjectId || redirectCancelled) return;
    const timer = window.setTimeout(() => {
      navigate(`/project/${activeProjectId}?tab=brief`);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [activeProjectId, navigate, redirectCancelled]);

  // Still redirecting
  if (activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <Button
          variant="outline"
          onClick={() => {
            setRedirectCancelled(true);
            setActiveProjectId(null);
            navigate('/brief');
          }}
        >
          Start a new project
        </Button>
      </div>
    );
  }

  // Path B: no active project — show picker
  const projects = projectsQuery.data ?? [];
  const loading = projectsQuery.isLoading;

  const openBrief = (id: number) => {
    setActiveProjectId(id);
    navigate(`/project/${id}?tab=brief`);
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Project Brief</h1>
          <p className="text-sm text-muted-foreground">
            Select a project to view its compliance brief, or create a new one to get started.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one to generate your first compliance brief.
          </p>
          <Button variant="default" onClick={() => navigate('/project-checklists')}>
            Create new project →
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border divide-y">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => openBrief(project.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[project.occupancyCode, project.address].filter(Boolean).join(' · ') || 'No details set'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground ml-2" />
              </button>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate('/project-checklists')}>
            Create new project →
          </Button>
        </div>
      )}
    </div>
  );
}
