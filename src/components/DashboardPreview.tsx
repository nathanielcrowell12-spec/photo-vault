'use client';

import { THEMES, type ThemeColors } from '@/lib/themes';
import { useColorTheme } from '@/components/ThemeProvider';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Camera,
  Users,
  DollarSign,
  Image,
  Plus,
  Bell,
  Settings,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

/**
 * Dashboard Preview Component
 *
 * Renders a static mockup of the photographer dashboard
 * that updates in real-time as themes are changed.
 *
 * This is NOT the actual dashboard - it's a visual preview
 * for demonstrating theme options to beta testers.
 */
export function DashboardPreview() {
  const { colorTheme } = useColorTheme();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full aspect-[16/10] bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground">Loading preview...</span>
      </div>
    );
  }

  const theme = THEMES[colorTheme];
  if (!theme) return null;

  // Use light or dark colors based on current mode
  const colors = resolvedTheme === 'dark' ? theme.dark : theme.light;

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden shadow-xl">
      {/* Preview Label */}
      <div className="bg-muted px-3 py-1.5 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Photographer Dashboard Preview
        </span>
        <span className="text-xs text-muted-foreground">
          {theme.name} • {resolvedTheme === 'dark' ? 'Dark' : 'Light'} Mode
        </span>
      </div>

      {/* Dashboard Mockup */}
      <div
        className="aspect-[16/10] overflow-hidden"
        style={{ backgroundColor: colors.background }}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <Sidebar colors={colors} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header */}
            <Header colors={colors} />

            {/* Dashboard Content */}
            <main
              className="flex-1 p-3 overflow-auto"
              style={{ backgroundColor: colors.background }}
            >
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <StatCard
                  colors={colors}
                  icon={<FolderOpen className="w-3 h-3" />}
                  label="Active Galleries"
                  value="12"
                />
                <StatCard
                  colors={colors}
                  icon={<Users className="w-3 h-3" />}
                  label="Total Clients"
                  value="47"
                />
                <StatCard
                  colors={colors}
                  icon={<DollarSign className="w-3 h-3" />}
                  label="Monthly Earnings"
                  value="$1,240"
                />
                <StatCard
                  colors={colors}
                  icon={<Image className="w-3 h-3" />}
                  label="Photos Uploaded"
                  value="2,847"
                />
              </div>

              {/* Recent Galleries */}
              <div
                className="rounded-lg p-3 mb-3"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: colors.foreground }}
                  >
                    Recent Galleries
                  </h3>
                  <button
                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryForeground
                    }}
                  >
                    <Plus className="w-3 h-3" />
                    New Gallery
                  </button>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-4 gap-2">
                  <GalleryCard colors={colors} title="Johnson Wedding" date="Dec 2, 2025" photos={248} />
                  <GalleryCard colors={colors} title="Smith Family" date="Nov 28, 2025" photos={89} />
                  <GalleryCard colors={colors} title="Corporate Event" date="Nov 15, 2025" photos={156} />
                  <GalleryCard colors={colors} title="Senior Portraits" date="Nov 10, 2025" photos={42} />
                </div>
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Recent Activity */}
                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.foreground }}
                  >
                    Recent Activity
                  </h3>
                  <div className="space-y-1.5">
                    <ActivityItem colors={colors} text="Sarah J. viewed Johnson Wedding gallery" time="2 min ago" />
                    <ActivityItem colors={colors} text="New subscription: Mike Thompson" time="1 hour ago" />
                    <ActivityItem colors={colors} text="Commission received: $50.00" time="3 hours ago" />
                  </div>
                </div>

                {/* Quick Actions */}
                <div
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: colors.foreground }}
                  >
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    <QuickActionButton colors={colors} icon={<Plus className="w-3 h-3" />} label="Create Gallery" />
                    <QuickActionButton colors={colors} icon={<Users className="w-3 h-3" />} label="Invite Client" />
                    <QuickActionButton colors={colors} icon={<MessageSquare className="w-3 h-3" />} label="Send Message" />
                    <QuickActionButton colors={colors} icon={<CreditCard className="w-3 h-3" />} label="View Earnings" />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-components for the preview

function Sidebar({ colors }: { colors: ThemeColors }) {
  return (
    <div
      className="w-36 flex flex-col border-r"
      style={{
        backgroundColor: colors.sidebar,
        borderColor: colors.sidebarBorder
      }}
    >
      {/* Logo */}
      <div className="p-2 border-b" style={{ borderColor: colors.sidebarBorder }}>
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.sidebarPrimary }}
          >
            <Camera className="w-3.5 h-3.5" style={{ color: colors.sidebarPrimaryForeground }} />
          </div>
          <span
            className="font-semibold text-xs"
            style={{ color: colors.sidebarForeground }}
          >
            PhotoVault
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-1.5 space-y-0.5">
        <NavItem colors={colors} icon={<LayoutDashboard className="w-3 h-3" />} label="Dashboard" active />
        <NavItem colors={colors} icon={<FolderOpen className="w-3 h-3" />} label="Galleries" />
        <NavItem colors={colors} icon={<Users className="w-3 h-3" />} label="Clients" />
        <NavItem colors={colors} icon={<DollarSign className="w-3 h-3" />} label="Earnings" />
        <NavItem colors={colors} icon={<MessageSquare className="w-3 h-3" />} label="Messages" />
        <NavItem colors={colors} icon={<Settings className="w-3 h-3" />} label="Settings" />
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t" style={{ borderColor: colors.sidebarBorder }}>
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded-full"
            style={{ backgroundColor: colors.sidebarAccent }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[9px] font-medium truncate"
              style={{ color: colors.sidebarForeground }}
            >
              John Smith
            </p>
            <p
              className="text-[8px] truncate"
              style={{ color: colors.mutedForeground }}
            >
              Pro Plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({ colors }: { colors: ThemeColors }) {
  return (
    <header
      className="px-3 py-2 border-b flex items-center justify-between"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border
      }}
    >
      <div>
        <h1
          className="text-sm font-semibold"
          style={{ color: colors.foreground }}
        >
          Dashboard
        </h1>
        <p
          className="text-[10px]"
          style={{ color: colors.mutedForeground }}
        >
          Welcome back, John
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: colors.secondary }}
        >
          <Bell className="w-3 h-3" style={{ color: colors.secondaryForeground }} />
        </button>
        <button
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: colors.secondary }}
        >
          <HelpCircle className="w-3 h-3" style={{ color: colors.secondaryForeground }} />
        </button>
      </div>
    </header>
  );
}

function NavItem({
  colors,
  icon,
  label,
  active = false
}: {
  colors: ThemeColors;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px]"
      style={{
        backgroundColor: active ? colors.sidebarAccent : 'transparent',
        color: active ? colors.sidebarAccentForeground : colors.sidebarForeground
      }}
    >
      {icon}
      {label}
    </div>
  );
}

function StatCard({
  colors,
  icon,
  label,
  value
}: {
  colors: ThemeColors;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-lg p-2"
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`
      }}
    >
      <div className="flex items-center gap-1 mb-1">
        <div
          className="p-1 rounded"
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          <span style={{ color: colors.primary }}>{icon}</span>
        </div>
      </div>
      <p
        className="text-sm font-bold"
        style={{ color: colors.foreground }}
      >
        {value}
      </p>
      <p
        className="text-[9px]"
        style={{ color: colors.mutedForeground }}
      >
        {label}
      </p>
    </div>
  );
}

function GalleryCard({
  colors,
  title,
  date,
  photos
}: {
  colors: ThemeColors;
  title: string;
  date: string;
  photos: number;
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: colors.secondary,
        border: `1px solid ${colors.border}`
      }}
    >
      {/* Placeholder image */}
      <div
        className="aspect-[4/3] relative"
        style={{ backgroundColor: colors.muted }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Image className="w-4 h-4" style={{ color: colors.mutedForeground }} />
        </div>
      </div>
      <div className="p-1.5">
        <p
          className="text-[9px] font-medium truncate"
          style={{ color: colors.foreground }}
        >
          {title}
        </p>
        <p
          className="text-[8px]"
          style={{ color: colors.mutedForeground }}
        >
          {date} • {photos} photos
        </p>
      </div>
    </div>
  );
}

function ActivityItem({
  colors,
  text,
  time
}: {
  colors: ThemeColors;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <p
        className="text-[9px] truncate flex-1"
        style={{ color: colors.foreground }}
      >
        {text}
      </p>
      <p
        className="text-[8px] ml-2"
        style={{ color: colors.mutedForeground }}
      >
        {time}
      </p>
    </div>
  );
}

function QuickActionButton({
  colors,
  icon,
  label
}: {
  colors: ThemeColors;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="flex items-center gap-1 px-2 py-1.5 rounded text-[9px]"
      style={{
        backgroundColor: colors.secondary,
        color: colors.secondaryForeground
      }}
    >
      {icon}
      {label}
    </button>
  );
}
