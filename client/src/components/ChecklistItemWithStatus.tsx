import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChecklistStatusIcon, ChecklistStatusSelector, ChecklistStatus } from './ChecklistStatusIcon';
import { Button } from '@/components/ui/button';
import { Trash2, Save } from 'lucide-react';

interface ChecklistItemWithStatusProps {
  id?: number;
  itemId: string;
  itemText: string;
  status?: ChecklistStatus;
  isCompleted?: boolean;
  notes?: string;
  onStatusChange?: (status: ChecklistStatus) => void;
  onCompletedChange?: (completed: boolean) => void;
  onDelete?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
}

export function ChecklistItemWithStatus({
  id,
  itemId,
  itemText,
  status = 'pending',
  isCompleted = false,
  notes,
  onStatusChange,
  onCompletedChange,
  onDelete,
  onSave,
  isSaving = false,
  isDirty = false,
}: ChecklistItemWithStatusProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 hover:bg-accent/30 transition-colors">
      {/* Main item row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <Checkbox
          id={itemId}
          checked={isCompleted}
          onCheckedChange={(checked) => onCompletedChange?.(checked as boolean)}
          className="mt-1"
        />

        {/* Item text and status */}
        <div className="flex-1 min-w-0">
          <Label
            htmlFor={itemId}
            className={`text-sm font-medium cursor-pointer block mb-2 ${
              isCompleted ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {itemText}
          </Label>

          {/* Status selector */}
          {onStatusChange && (
            <div className="flex items-center gap-2">
              <ChecklistStatusSelector
                value={status}
                onChange={onStatusChange}
                disabled={isSaving}
              />
            </div>
          )}
        </div>

        {/* Status icon display */}
        <div className="flex-shrink-0">
          <ChecklistStatusIcon status={status} size="md" />
        </div>
      </div>

      {/* Notes section (expandable) */}
      {notes && (
        <div className="ml-7 text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-muted">
          <p className="font-medium mb-1">Notes:</p>
          <p>{notes}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 ml-7">
        {onSave && isDirty && (
          <Button
            size="sm"
            variant="default"
            onClick={onSave}
            disabled={isSaving}
            className="gap-1"
          >
            <Save size={14} />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}

        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isSaving}
            className="gap-1 text-destructive hover:text-destructive"
          >
            <Trash2 size={14} />
            Delete
          </Button>
        )}

        {notes && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="ml-auto"
          >
            {expanded ? 'Hide' : 'Show'} Notes
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for displaying in lists
 */
export function ChecklistItemCompact({
  itemText,
  status = 'pending',
  isCompleted = false,
}: {
  itemText: string;
  status?: ChecklistStatus;
  isCompleted?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-muted/20 rounded border border-border/50">
      <ChecklistStatusIcon status={status} size="sm" />
      <span
        className={`text-sm flex-1 ${
          isCompleted ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {itemText}
      </span>
    </div>
  );
}
