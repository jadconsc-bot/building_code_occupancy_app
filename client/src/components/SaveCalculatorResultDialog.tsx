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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProject } from '@/contexts/ProjectContext';
import { trpc } from '@/lib/trpc';
import { Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SaveCalculatorResultDialogProps {
  calculatorType: string;
  inputData: Record<string, unknown>;
  resultData: Record<string, unknown>;
  children?: React.ReactNode;
}

export function SaveCalculatorResultDialog({
  calculatorType,
  inputData,
  resultData,
  children,
}: SaveCalculatorResultDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { activeProjectId } = useProject();
  const { data: projects = [] } = trpc.projects.list.useQuery();
  const saveMutation = trpc.projects.calculatorResults.save.useMutation();

  const handleSave = async () => {
    const projectId = selectedProjectId ? parseInt(selectedProjectId, 10) : activeProjectId;

    if (!projectId) {
      toast.error('Please select a project');
      return;
    }

    setIsLoading(true);
    try {
      await saveMutation.mutateAsync({
        projectId,
        calculatorType,
        inputData: JSON.stringify(inputData),
        resultData: JSON.stringify(resultData),
        notes: notes || undefined,
      });

      toast.success('Calculator result saved to project');
      setIsOpen(false);
      setNotes('');
      setSelectedProjectId('');
    } catch (error) {
      console.error('Failed to save calculator result:', error);
      toast.error('Failed to save calculator result');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Save size={16} />
            Save to Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Calculator Result</DialogTitle>
          <DialogDescription>
            Save this {calculatorType} calculation to a project for future reference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {projects.length === 0 ? (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                No projects found. Create a project first to save calculator results.
              </p>
            </div>
          ) : (
            <>
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

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this calculation..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-24 resize-none"
                />
              </div>
            </>
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
            {isLoading ? 'Saving...' : 'Save Result'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
