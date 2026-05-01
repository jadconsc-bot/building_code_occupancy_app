import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useProject } from '@/contexts/ProjectContext';
import { trpc } from '@/lib/trpc';
import { ProjectChecklistDashboard } from '@/components/ProjectChecklistDashboard';
import { ProjectWizard } from '@/components/ProjectWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus } from 'lucide-react';
import { useLocation } from 'wouter';

const BUILDING_TYPE_LABELS: Record<string, string> = {
  part9_single_family: 'Part 9 - Single Family',
  part9_multiplex: 'Part 9 - Multi-Family',
  part3_residential: 'Part 3 - Residential',
  part3_commercial: 'Part 3 - Commercial',
  part3_industrial: 'Part 3 - Industrial',
};

const CONSTRUCTION_TYPE: Record<string, string> = {
  part9_single_family: 'Combustible',
  part9_multiplex: 'Combustible',
  part3_residential: 'Non-Combustible',
  part3_commercial: 'Non-Combustible',
  part3_industrial: 'Non-Combustible',
};

const CODE_EDITION: Record<string, string> = {
  AB: 'NBC(AE) 2023',
  BC: 'BCBC 2024',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}

export default function ProjectChecklistsPage() {
  const { user, loading } = useAuth();
  const { activeProjectId, setActiveProjectId, getAllProjects } = useProject();
  const [, setLocation] = useLocation();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const projects = getAllProjects();

  // Fetch full project row (includes buildingType, province, climateZone, projectCode, projectNumber)
  const { data: activeProjectData } = trpc.projects.get.useQuery(
    { id: activeProjectId! },
    { enabled: !!activeProjectId }
  );

  // Health check queries — only run when a project is selected
  const snapshotsQuery = trpc.compliance.getProjectSnapshots.useQuery(
    { projectId: activeProjectId! },
    { enabled: !!activeProjectId }
  );

  const checklistQuery = trpc.projectsLegacy.checklistItems.list.useQuery(
    { projectId: activeProjectId! },
    { enabled: !!activeProjectId }
  );

  const reportsQuery = trpc.projectsLegacy.calculatorResults.list.useQuery(
    { projectId: activeProjectId! },
    { enabled: !!activeProjectId }
  );

  // Derived health values
  const hasSnapshots = (snapshotsQuery.data?.length ?? 0) > 0;
  const checklistItems = checklistQuery.data ?? [];
  const hasChecklist = checklistItems.length > 0;
  const completedCount = checklistItems.filter((i: any) => i.isCompleted === 1).length;
  const completionPct = hasChecklist
    ? Math.round((completedCount / checklistItems.length) * 100)
    : 0;
  const hasReport = (reportsQuery.data?.length ?? 0) > 0;

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
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">

            {/* Project list */}
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
                        onClick={() => setActiveProjectId(parseInt(project.id))}
                      >
                        <div className="truncate">
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {project.description || [project.projectNumber, project.occupancyCode ? `Occupancy ${project.occupancyCode}` : null].filter(Boolean).join(' · ') || 'No description'}
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
                  onClick={() => setIsWizardOpen(true)}
                >
                  <Plus size={16} />
                  New Project
                </Button>
              </CardContent>
            </Card>

            {/* Project details + health panel */}
            {activeProjectData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <InfoRow
                    label="Project #"
                    value={(activeProjectData as any).projectNumber ?? (activeProjectData as any).projectCode ?? '—'}
                  />
                  <InfoRow
                    label="Occupancy"
                    value={activeProjectData.occupancyCode ?? '—'}
                  />
                  <InfoRow
                    label="Building Type"
                    value={
                      (activeProjectData as any).buildingType
                        ? (BUILDING_TYPE_LABELS[(activeProjectData as any).buildingType] ?? (activeProjectData as any).buildingType)
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Construction"
                    value={
                      (activeProjectData as any).buildingType
                        ? (CONSTRUCTION_TYPE[(activeProjectData as any).buildingType] ?? '—')
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Province"
                    value={(activeProjectData as any).province ?? '—'}
                  />
                  <InfoRow
                    label="Climate Zone"
                    value={
                      (activeProjectData as any).climateZone
                        ? `Zone ${(activeProjectData as any).climateZone}`
                        : '—'
                    }
                  />
                  <InfoRow
                    label="Code Edition"
                    value={
                      (activeProjectData as any).province
                        ? (CODE_EDITION[(activeProjectData as any).province] ?? 'NBC 2020')
                        : '—'
                    }
                  />

                  {/* Health Check */}
                  <div className="pt-3 mt-1 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Project Health
                    </p>

                    {/* Compliance Analysis */}
                    <div className="flex items-start gap-2 text-xs">
                      {hasSnapshots ? (
                        <>
                          <span className="text-green-600 font-bold shrink-0">✓</span>
                          <span className="text-green-700">
                            Analysis complete —{' '}
                            <button
                              className="underline hover:no-underline"
                              onClick={() => setLocation(`/compliance/${activeProjectId}`)}
                            >
                              view
                            </button>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-red-500 font-bold shrink-0">✗</span>
                          <span className="text-red-700">No analysis run</span>
                        </>
                      )}
                    </div>

                    {/* Inspection Checklist */}
                    <div className="flex items-start gap-2 text-xs">
                      {hasChecklist ? (
                        <>
                          <span className="text-green-600 font-bold shrink-0">✓</span>
                          <span className="text-green-700">
                            {checklistItems.length} items, {completionPct}% complete
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-red-500 font-bold shrink-0">✗</span>
                          <span className="text-red-700">No checklist generated</span>
                        </>
                      )}
                    </div>

                    {/* Compliance Report */}
                    <div className="flex items-start gap-2 text-xs">
                      {hasReport ? (
                        <>
                          <span className="text-green-600 font-bold shrink-0">✓</span>
                          <span className="text-green-700">Report available</span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-foreground shrink-0">—</span>
                          <span className="text-muted-foreground">No report saved</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
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
      <ProjectWizard open={isWizardOpen} onOpenChange={setIsWizardOpen} />
    </div>
  );
}
