'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ThemePreviewContextType {
  previewColor: string | null;
  setPreviewColor: (color: string | null) => void;
}

const ThemePreviewContext = createContext<ThemePreviewContextType | undefined>(undefined);

export function ThemePreviewProvider({ children }: { children: ReactNode }) {
  const [previewColor, setPreviewColor] = useState<string | null>(null);

  return (
    <ThemePreviewContext.Provider value={{ previewColor, setPreviewColor }}>
      {children}
    </ThemePreviewContext.Provider>
  );
}

export function useThemePreview() {
  const context = useContext(ThemePreviewContext);
  if (!context) {
    throw new Error('useThemePreview must be used within ThemePreviewProvider');
  }
  return context;
}


