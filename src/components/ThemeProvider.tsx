'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { THEMES, DEFAULT_THEME, getTheme, themeToCssVariables } from '@/lib/themes';

interface ColorThemeContextType {
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  availableThemes: { id: string; name: string; description: string }[];
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

/**
 * Hook to access and change the color theme
 */
export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error('useColorTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Combined theme provider that handles:
 * 1. Light/Dark mode (via next-themes)
 * 2. Color theme selection (our custom themes from themes.ts)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorTheme, setColorThemeState] = useState<string>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Load saved color theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('photovault-color-theme');
    if (saved && THEMES[saved]) {
      setColorThemeState(saved);
    }
    setMounted(true);
  }, []);

  // Apply theme CSS variables when color theme changes
  useEffect(() => {
    if (!mounted) return;

    const theme = getTheme(colorTheme);
    if (!theme) return;

    const root = document.documentElement;

    // Apply light mode variables
    const lightVars = themeToCssVariables(theme.light);
    const darkVars = themeToCssVariables(theme.dark);

    // We'll use a data attribute to store which color theme is active
    root.setAttribute('data-color-theme', colorTheme);

    // Apply CSS variables based on current mode
    // next-themes handles the .dark class, we listen for changes
    const applyThemeVars = () => {
      const isDark = root.classList.contains('dark');
      const vars = isDark ? darkVars : lightVars;

      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    };

    // Initial application
    applyThemeVars();

    // Watch for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyThemeVars();
        }
      });
    });

    observer.observe(root, { attributes: true });

    return () => observer.disconnect();
  }, [colorTheme, mounted]);

  const setColorTheme = (theme: string) => {
    if (THEMES[theme]) {
      setColorThemeState(theme);
      localStorage.setItem('photovault-color-theme', theme);
    }
  };

  const availableThemes = Object.values(THEMES).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme, availableThemes }}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </ColorThemeContext.Provider>
  );
}
