'use client';

import { useColorTheme } from '@/components/ThemeProvider';
import { THEMES } from '@/lib/themes';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Monitor, Palette, Check, ExternalLink, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DashboardPreview } from '@/components/DashboardPreview';

/**
 * Theme Picker Component
 *
 * Allows admins to:
 * 1. Switch between color themes (Warm Gallery, Cool Professional, etc.)
 * 2. Toggle light/dark mode
 * 3. See a preview of each theme
 *
 * HOW TO ADD NEW THEMES:
 * Edit src/lib/themes.ts - new themes automatically appear here
 */
export function ThemePicker() {
  const { colorTheme, setColorTheme, availableThemes } = useColorTheme();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Settings
          </CardTitle>
          <CardDescription>Loading theme options...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Customize the look and feel of PhotoVault. Changes apply instantly and persist across sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Theme Selection */}
        <div className="space-y-3">
          <Label htmlFor="color-theme" className="text-sm font-medium">
            Color Theme
          </Label>
          <Select value={colorTheme} onValueChange={setColorTheme}>
            <SelectTrigger id="color-theme" className="w-full">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {availableThemes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <div className="flex items-center gap-2">
                    <span>{t.name}</span>
                    {colorTheme === t.id && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Current theme description */}
          <p className="text-sm text-muted-foreground">
            {availableThemes.find(t => t.id === colorTheme)?.description}
          </p>
        </div>

        {/* Light/Dark Mode Toggle */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Appearance</Label>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
              className="flex-1"
            >
              <Monitor className="h-4 w-4 mr-2" />
              System
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Current: {resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode'}
            {theme === 'system' && ' (following system preference)'}
          </p>
        </div>

        {/* Theme Preview Swatches */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme Preview</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {availableThemes.map((t) => (
              <ThemePreviewCard
                key={t.id}
                themeId={t.id}
                name={t.name}
                isActive={colorTheme === t.id}
                onClick={() => setColorTheme(t.id)}
              />
            ))}
          </div>
        </div>

        {/* Dashboard Preview Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Dashboard Preview</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                See how themes look on the photographer dashboard
              </p>
            </div>
            <Button
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show Preview
                </>
              )}
            </Button>
          </div>

          {/* Dashboard Preview Panel */}
          {showPreview && (
            <div className="mt-4">
              <DashboardPreview />
            </div>
          )}
        </div>

        {/* Add New Theme Instructions */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Want to create a new theme?</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Go to{' '}
                  <a
                    href="https://realtimecolors.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Realtime Colors
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Design your palette with 5 colors</li>
                <li>Export with Themes and Shades toggled ON</li>
                <li>Edit <code className="bg-background px-1 rounded">src/lib/themes.ts</code></li>
                <li>Add your new theme following the existing pattern</li>
              </ol>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Small preview card for each theme
 */
function ThemePreviewCard({
  themeId,
  name,
  isActive,
  onClick,
}: {
  themeId: string;
  name: string;
  isActive: boolean;
  onClick: () => void;
}) {
  // Get theme colors for preview
  const theme = THEMES[themeId];

  if (!theme) return null;

  const colors = theme.light; // Show light mode colors in preview

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg border-2 transition-all
        ${isActive
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground'
        }
      `}
    >
      {/* Color swatches */}
      <div className="flex gap-1 mb-2">
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: colors.primary }}
          title="Primary"
        />
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: colors.accent }}
          title="Accent"
        />
        <div
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: colors.background }}
          title="Background"
        />
      </div>

      {/* Theme name */}
      <span className="text-xs font-medium truncate block">{name}</span>

      {/* Active indicator */}
      {isActive && (
        <Badge
          variant="default"
          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center"
        >
          <Check className="h-3 w-3" />
        </Badge>
      )}
    </button>
  );
}

/**
 * Compact version for header/nav
 */
export function ThemePickerCompact() {
  const { colorTheme, setColorTheme, availableThemes } = useColorTheme();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Color theme dropdown */}
      <Select value={colorTheme} onValueChange={setColorTheme}>
        <SelectTrigger className="w-[140px] h-8">
          <Palette className="h-4 w-4 mr-1" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableThemes.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Light/dark toggle */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
