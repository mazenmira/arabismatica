'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface DarkModeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export const useDarkMode = () => useContext(DarkModeContext);
