import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

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

// Common keyboard shortcuts for the ticket system
export const useTicketKeyboardShortcuts = () => {
  const { user } = useAuthStore();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: () => {
        if (user?.activeRole === 'END_USER') {
          window.location.href = '/tickets/create';
        }
      },
      description: 'Create new ticket',
    },
    {
      key: 'h',
      ctrlKey: true,
      action: () => {
        window.location.href = '/dashboard';
      },
      description: 'Go to dashboard',
    },
    {
      key: 't',
      ctrlKey: true,
      action: () => {
        window.location.href = '/tickets';
      },
      description: 'Go to tickets',
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector(
          'input[placeholder*="Search"]'
        ) as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or dropdowns
        const modals = document.querySelectorAll('[role="dialog"]');
        const dropdowns = document.querySelectorAll('[aria-expanded="true"]');

        if (modals.length > 0) {
          const closeButton = modals[modals.length - 1].querySelector(
            '[aria-label*="close"], [aria-label*="Close"]'
          ) as HTMLElement;
          closeButton?.click();
        } else if (dropdowns.length > 0) {
          (dropdowns[dropdowns.length - 1] as HTMLElement).click();
        }
      },
      description: 'Close modal or dropdown',
    },
  ];

  useKeyboardNavigation(shortcuts);
};
