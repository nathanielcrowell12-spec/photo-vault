'use client';

import { useColorTheme } from '@/components/ThemeProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics/client';

/**
 * ThemeModeToggle - Simple Light/Dark Mode Toggle
 *
 * Provides a user-friendly toggle between:
 * - Light Mode = Original Teal theme in light mode (DEFAULT)
 * - Dark Mode = Gallery Dark theme in dark mode
 *
 * Unlike the admin ThemePicker (which offers 5 color themes),
 * this gives users a simple binary choice optimized for visibility.
 *
 * @param variant - 'full' shows button with label, 'icon' shows icon only
 */

interface ThemeModeToggleProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export function ThemeModeToggle({ variant = 'full', className }: ThemeModeToggleProps) {
  const { setColorTheme } = useColorTheme();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch - resolvedTheme is undefined on server
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set default to light mode for new users (no saved preferences)
  useEffect(() => {
    if (!mounted) return;

    try {
      const savedMode = localStorage.getItem('theme');
      const savedColorTheme = localStorage.getItem('photovault-color-theme');

      // First-time user: set to light mode explicitly
      if (!savedMode && !savedColorTheme) {
        setTheme('light');
        setColorTheme('original-teal');
      }
    } catch (error) {
      // localStorage may be unavailable (private browsing, etc.)
      console.warn('Could not access localStorage for theme preferences:', error);
    }
  }, [mounted, setTheme, setColorTheme]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    // Preserve layout space to prevent shift
    if (variant === 'icon') {
      return <div className="w-10 h-10" />;
    }
    return <div className="w-[140px] h-10" />;
  }

  const isLightMode = resolvedTheme === 'light';

  const toggleMode = () => {
    const fromMode = isLightMode ? 'light' : 'dark';
    const toMode = isLightMode ? 'dark' : 'light';

    try {
      if (isLightMode) {
        // Switch to Dark Mode
        setColorTheme('gallery-dark');
        setTheme('dark');
      } else {
        // Switch to Light Mode
        setColorTheme('original-teal');
        setTheme('light');
      }

      // Track theme toggle in PostHog
      trackEvent('theme_toggle_clicked', {
        from_mode: fromMode,
        to_mode: toMode,
      });
    } catch (error) {
      console.error('Failed to toggle theme:', error);
      // Still try to apply the theme even if tracking fails
      if (isLightMode) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    }
  };

  // Icon-only variant for tight spaces (headers)
  if (variant === 'icon') {
    return (
      <Button
        onClick={toggleMode}
        variant="ghost"
        size="icon"
        aria-label={
          isLightMode
            ? 'Currently in light mode. Click to switch to dark mode'
            : 'Currently in dark mode. Click to switch to light mode'
        }
        className={cn(
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
      >
        {isLightMode ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    );
  }

  // Full button variant with label (for prominent placement)
  return (
    <Button
      onClick={toggleMode}
      variant="outline"
      size="lg"
      aria-label={
        isLightMode
          ? 'Currently in light mode. Click to switch to dark mode'
          : 'Currently in dark mode. Click to switch to light mode'
      }
      className={cn(
        'flex items-center gap-2 font-medium',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {isLightMode ? (
        <>
          <Sun className="h-5 w-5" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span>Dark Mode</span>
        </>
      )}
    </Button>
  );
}
