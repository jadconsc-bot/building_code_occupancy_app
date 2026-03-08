import { useState, useMemo } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChecklistStatusIcon, ChecklistStatus } from './ChecklistStatusIcon';
import { ChecklistItemCompact } from './ChecklistItemWithStatus';
import { Phase2ReportManager } from './Phase2ReportManager';
import { Phase2ScenarioManager } from './Phase2ScenarioManager';
import { Phase2BatchComparison } from './Phase2BatchComparison';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  FileText,
  GitBranch,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItemDisplay {
  id: number;
  phase: string;
  itemId: string;
  itemText: string;
  isCompleted: number;
  notes: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export function ProjectChecklistDashboard() {
  const { activeProjectId } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('checklists');

  // Fetch projects list
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery(
    undefined,
    { enabled: !!activeProjectId }
  );

  // Get active project data
  const activeProject = projects.find(p => p.id === activeProjectId);
  const checklistItems: any[] = [];
  const calculatorResults: any[] = [];

  // Filter and group checklist items
  const filteredItems = useMemo(() => {
    let items = checklistItems;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item: any) =>
          item.itemText?.toLowerCase().includes(query) ||
          item.itemId?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by phase
    if (selectedPhase !== 'all') {
      items = items.filter((item: any) => item.phase === selectedPhase);
    }

    // Filter by status (based on completion)
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'completed') {
        items = items.filter((item: any) => item.isCompleted === 1);
      } else if (selectedStatus === 'pending') {
        items = items.filter((item: any) => item.isCompleted === 0);
      }
    }

    return items;
  }, [checklistItems, searchQuery, selectedPhase, selectedStatus]);

  // Group by phase
  const groupedByPhase = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    filteredItems.forEach((item: any) => {
      const phase = item?.phase || 'uncategorized';
      if (!grouped[phase]) {
        grouped[phase] = [];
      }
      grouped[phase].push(item);
    });
    return grouped;
  }, [filteredItems]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = checklistItems?.length || 0;
    const completed = checklistItems?.filter((i: any) => i?.isCompleted === 1)?.length || 0;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  }, [checklistItems]);

  const togglePhase = (phase: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
  };

  const phases = Array.from(new Set(checklistItems.map((item) => item.phase)));

  if (!activeProjectId) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800">
            No active project selected. Please select a project to view checklists.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render the main content with tabs
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Project Checklists</h2>
        <p className="text-sm text-muted-foreground">
          View and manage all saved inspection checklists for your project
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Items</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different features */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="checklists" className="flex items-center gap-2">
            <FileText size={16} />
            <span className="hidden sm:inline">Checklists</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText size={16} />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <GitBranch size={16} />
            <span className="hidden sm:inline">Scenarios</span>
          </TabsTrigger>
          <TabsTrigger value="comparisons" className="flex items-center gap-2">
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Comparisons</span>
          </TabsTrigger>
        </TabsList>

        {/* Checklists Tab */}
        <TabsContent value="checklists" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items, phases, or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Phase Filter */}
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by phase..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {phases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase.charAt(0).toUpperCase() + phase.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Checklist Items by Phase */}
          <div className="space-y-4">
            {Object.entries(groupedByPhase).length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No checklist items found. {searchQuery && 'Try adjusting your search filters.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(groupedByPhase).map(([phase, items]) => (
                <Card key={phase}>
                  <CardHeader
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => togglePhase(phase)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {expandedPhases.has(phase) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                          </CardTitle>
                          <CardDescription>{items.length} items</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">{items.length}</Badge>
                    </div>
                  </CardHeader>

                  {expandedPhases.has(phase) && (
                    <CardContent className="space-y-3 border-t pt-4">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                        >
                          <ChecklistStatusIcon
                            status={item.isCompleted === 1 ? 'pass' : 'pending'}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.itemText}</p>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(item.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast('Delete functionality coming soon')}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {activeProjectId && <Phase2ReportManager projectId={activeProjectId as number} />}
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-4">
          {activeProjectId && <Phase2ScenarioManager projectId={activeProjectId as number} />}
        </TabsContent>

        {/* Comparisons Tab */}
        <TabsContent value="comparisons" className="space-y-4">
          {activeProjectId && <Phase2BatchComparison projectId={activeProjectId as number} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
