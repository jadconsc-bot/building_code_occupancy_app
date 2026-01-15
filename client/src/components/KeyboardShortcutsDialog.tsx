import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  { keys: ['Ctrl', 'K'], description: 'Focus search', category: 'Navigation' },
  { keys: ['Ctrl', 'B'], description: 'Toggle bookmarks', category: 'Navigation' },
  { keys: ['Ctrl', 'H'], description: 'Show help', category: 'Navigation' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close dialog/modal', category: 'Navigation' },
  { keys: ['Ctrl', 'T'], description: 'Toggle theme', category: 'Appearance' },
  { keys: ['Ctrl', 'Shift', 'C'], description: 'Toggle high contrast', category: 'Accessibility' },
  { keys: ['Tab'], description: 'Navigate forward', category: 'Accessibility' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backward', category: 'Accessibility' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="keyboard-shortcuts-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription id="keyboard-shortcuts-description">
            Use these keyboard shortcuts to navigate the app more efficiently
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm">
                              {key}
                            </kbd>
                            {i < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
