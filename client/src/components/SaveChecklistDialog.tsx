import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useProject } from '@/contexts/ProjectContext';
import { trpc } from '@/lib/trpc';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export interface ChecklistItemToSave {
  phase: string;
  itemId: string;
  itemText: string;
  status: 'pass' | 'fail' | 'conditional' | 'pending';
  notes?: string;
}

interface SaveChecklistDialogProps {
  phase: string;
  items: ChecklistItemToSave[];
  children?: React.ReactNode;
}

export function SaveChecklistDialog({
  phase,
  items,
  children,
}: SaveChecklistDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { activeProjectId } = useProject();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const bulkSaveMutation = trpc.projectsLegacy.checklistItems.save.useMutation();

  const handleSave = async () => {
    const projectId = selectedProjectId ? parseInt(selectedProjectId, 10) : activeProjectId;

    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    if (items.length === 0) {
      toast.error('No checklist items to save');
      return;
    }

    setIsLoading(true);
    try {
      for (const item of items) {
        await bulkSaveMutation.mutateAsync({
          projectId,
          phase: item.phase,
          itemId: item.itemId,
          itemText: item.itemText,
          isCompleted: item.status === 'pass' || item.status === 'conditional',
          notes: item.notes,
        });
      }

      toast.success(`${items.length} checklist items saved to project`);
      setIsOpen(false);
      setSelectedProjectId('');
    } catch (error) {
      console.error('Failed to save checklist items:', error);
      toast.error('Failed to save checklist items');
    } finally {
      setIsLoading(false);
    }
  };

  const passCount = items.filter((i) => i.status === 'pass').length;
  const failCount = items.filter((i) => i.status === 'fail').length;
  const conditionalCount = items.filter((i) => i.status === 'conditional').length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Save size={16} />
            Save Checklist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Checklist to Project</DialogTitle>
          <DialogDescription>
            Save all {phase} phase checklist items to a project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Checklist Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-md border border-slate-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passCount}</div>
              <div className="text-xs text-slate-600">Pass</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{conditionalCount}</div>
              <div className="text-xs text-slate-600">Conditional</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failCount}</div>
              <div className="text-xs text-slate-600">Fail</div>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                No projects found. Create a project first to save checklists.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="project-select">Select Project</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger id="project-select">
                  <SelectValue
                    placeholder={
                      activeProjectId ? 'Use active project' : 'Choose a project...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {activeProjectId && (
                    <SelectItem value="">
                      <span className="font-medium">Active Project</span>
                    </SelectItem>
                  )}
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name} ({project.occupancyCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || projects.length === 0}
            className="gap-2"
          >
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save Checklist'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
