import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export const GLOBAL_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Focus search' },
  BOOKMARKS: { key: 'b', ctrl: true, description: 'Toggle bookmarks' },
  HELP: { key: 'h', ctrl: true, description: 'Show help' },
  SHORTCUTS: { key: '/', ctrl: true, description: 'Show keyboard shortcuts' },
  ESCAPE: { key: 'Escape', description: 'Close dialog/modal' },
  THEME: { key: 't', ctrl: true, description: 'Toggle theme' },
  CONTRAST: { key: 'c', ctrl: true, shift: true, description: 'Toggle high contrast' },
};
