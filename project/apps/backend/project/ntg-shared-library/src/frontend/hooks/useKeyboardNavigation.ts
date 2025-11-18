import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

/**
 * Generic hook for handling keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcut configurations
 */
export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      shortcuts.forEach(
        ({ key, ctrlKey, altKey, shiftKey, metaKey, action }) => {
          if (
            event.key === key &&
            !!event.ctrlKey === !!ctrlKey &&
            !!event.altKey === !!altKey &&
            !!event.shiftKey === !!shiftKey &&
            !!event.metaKey === !!metaKey
          ) {
            event.preventDefault();
            action();
          }
        }
      );
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

