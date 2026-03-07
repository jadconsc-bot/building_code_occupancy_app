import { useProject } from '@/contexts/ProjectContext';
import { trpc } from '@/lib/trpc';

export interface ChecklistItem {
  id?: number;
  phase: string;
  itemId: string;
  itemText: string;
  isCompleted?: boolean;
  notes?: string;
  photoUrl?: string;
}

export function useProjectChecklist(phase?: string) {
  const { activeProjectId } = useProject();
  const utils = trpc.useUtils();

  const { data: items = [], isLoading } = trpc.projectsLegacy.checklistItems.list.useQuery(
    activeProjectId ? { projectId: activeProjectId, phase } : { skip: true } as any,
    { enabled: !!activeProjectId }
  );

  const saveMutation = trpc.projectsLegacy.checklistItems.save.useMutation({
    onSuccess: () => {
      if (activeProjectId) {
        utils.projectsLegacy.checklistItems.list.invalidate({ projectId: activeProjectId, phase });
      }
    },
  });

  const toggleMutation = trpc.projectsLegacy.checklistItems.toggle.useMutation({
    onSuccess: () => {
      if (activeProjectId) {
        utils.projectsLegacy.checklistItems.list.invalidate({ projectId: activeProjectId, phase });
        utils.projectsLegacy.get.invalidate({ id: activeProjectId });
      }
    },
  });

  const saveItem = async (item: ChecklistItem) => {
    if (!activeProjectId) {
      console.warn('No active project selected');
      return null;
    }

    try {
      const response = await saveMutation.mutateAsync({
        projectId: activeProjectId,
        phase: item.phase,
        itemId: item.itemId,
        itemText: item.itemText,
        isCompleted: item.isCompleted || false,
        notes: item.notes,
        photoUrl: item.photoUrl,
      });
      return response;
    } catch (error) {
      console.error('Failed to save checklist item:', error);
      throw error;
    }
  };

  const toggleItem = async (itemId: number, isCompleted: boolean) => {
    if (!activeProjectId) {
      console.warn('No active project selected');
      return null;
    }

    try {
      const response = await toggleMutation.mutateAsync({
        id: itemId,
        projectId: activeProjectId,
        isCompleted,
      });
      return response;
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
      throw error;
    }
  };

  return {
    activeProjectId,
    items,
    isLoading,
    saveItem,
    toggleItem,
    isSaving: saveMutation.isPending || toggleMutation.isPending,
  };
}
