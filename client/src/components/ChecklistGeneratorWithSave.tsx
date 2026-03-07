import { ReactNode, useState, useCallback } from 'react';
import { SaveChecklistDialog, ChecklistItemToSave } from './SaveChecklistDialog';
import { Button } from '@/components/ui/button';
import { Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistGeneratorWithSaveProps {
  phase: string;
  children: (onItemsChange: (items: ChecklistItemToSave[]) => void) => ReactNode;
}

export function ChecklistGeneratorWithSave({
  phase,
  children,
}: ChecklistGeneratorWithSaveProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItemToSave[]>([]);
  const [hasItems, setHasItems] = useState(false);

  const handleItemsChange = useCallback((items: ChecklistItemToSave[]) => {
    setChecklistItems(items);
    setHasItems(items.length > 0);
  }, []);

  const handleSaveClick = () => {
    if (checklistItems.length === 0) {
      toast.error('No checklist items to save');
      return;
    }

    const itemsWithStatus = checklistItems.filter((item) => item.status !== 'pending');
    if (itemsWithStatus.length === 0) {
      toast.warning('Please set status for at least one item before saving');
      return;
    }
  };

  return (
    <div className="space-y-4">
      {/* Checklist Generator Content */}
      <div>{children(handleItemsChange)}</div>

      {/* Save Section */}
      {hasItems && (
        <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Ready to save checklist?</p>
              <p className="text-xs text-muted-foreground mt-1">
                {checklistItems.length} items in this checklist. Set status for each item and save to your project.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <SaveChecklistDialog phase={phase} items={checklistItems}>
              <Button onClick={handleSaveClick} className="gap-2">
                <Save size={16} />
                Save All to Project
              </Button>
            </SaveChecklistDialog>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing checklist state in generators
 */
export function useChecklistGenerator(phase: string) {
  const [items, setItems] = useState<ChecklistItemToSave[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<Record<string, 'pass' | 'fail' | 'conditional' | 'pending'>>({});

  const addItem = useCallback(
    (itemId: string, itemText: string) => {
      const newItem: ChecklistItemToSave = {
        phase,
        itemId,
        itemText,
        status: selectedStatus[itemId] || 'pending',
      };

      setItems((prev) => {
        const existing = prev.findIndex((i) => i.itemId === itemId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newItem;
          return updated;
        }
        return [...prev, newItem];
      });
    },
    [phase, selectedStatus]
  );

  const updateItemStatus = useCallback(
    (itemId: string, status: 'pass' | 'fail' | 'conditional' | 'pending') => {
      setSelectedStatus((prev) => ({ ...prev, [itemId]: status }));
      setItems((prev) =>
        prev.map((item) => (item.itemId === itemId ? { ...item, status } : item))
      );
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.itemId !== itemId));
    setSelectedStatus((prev) => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
    setSelectedStatus({});
  }, []);

  return {
    items,
    selectedStatus,
    addItem,
    updateItemStatus,
    removeItem,
    clearAll,
  };
}
