'use client'

import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AccessGuard from '@/components/AccessGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlertTriangle,
  Archive,
  Cloud,
  Database,
  FileText,
  HardDrive,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Server,
  Settings,
} from 'lucide-react'

type LogLevel = 'success' | 'warning' | 'info' | 'error'

type ActionKey = 'backup' | 'rls' | 'vacuum' | 'errorProbe'

interface OperationLog {
  id: string
  message: string
  detail: string
  timestamp: string
  level: LogLevel
}

type StatusCard = {
  title: string
  subtitle: string
  status: string
  icon: string
  color: string
  bg: string
}

type MaintenanceTask = {
  title: string
  schedule: string
  notes: string
  icon: string
}

type RlsPolicy = {
  name: string
  table: string
  description: string
  status: string
}

type DatabaseStatus = {
  metrics: {
    totalUsers: number
    totalCollections: number
    totalPhotos: number
    storageUsedBytes: number
  }
  statusCards: StatusCard[]
  rlsPolicies: RlsPolicy[]
  maintenance: MaintenanceTask[]
}

const ICON_MAP = {
  Server,
  Cloud,
  ShieldCheck,
  Shield,
  Archive,
  Activity,
  HardDrive,
  AlertTriangle,
} as const

const ACTION_CONFIG: Record<
  ActionKey,
  {
    endpoint: string
    title: string
    successDetail: string
    level: LogLevel
    confirm?: string
    variant?: 'default' | 'secondary' | 'outline' | 'destructive'
    ariaLabel: string
  }
> = {
  backup: {
    endpoint: '/api/admin/database/backup',
    title: 'Manual backup',
    successDetail: 'Backup archived to cold storage.',
    level: 'success',
    ariaLabel: 'Trigger manual database backup',
  },
  rls: {
    endpoint: '/api/admin/database/rls',
    title: 'RLS validation',
    successDetail: 'Policies verified against Supabase metadata.',
    level: 'success',
    variant: 'secondary',
    ariaLabel: 'Validate row level security policies',
  },
  vacuum: {
    endpoint: '/api/admin/database/vacuum',
    title: 'Storage vacuum',
    successDetail: 'Vacuum completed and storage reclaimed.',
    level: 'success',
    variant: 'outline',
    confirm: 'Vacuum storage now? This may temporarily affect performance.',
    ariaLabel: 'Vacuum orphaned storage records',
  },
  errorProbe: {
    endpoint: '/api/admin/database/error-probe',
    title: 'Error probe',
    successDetail: 'Log bundle sent to engineering channel.',
    level: 'warning',
    variant: 'destructive',
    confirm: 'Generate error report and notify engineering?',
    ariaLabel: 'Collect recent database errors and notify engineering',
  },
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export default function AdminDatabasePage() {
  const { user, userType, loading } = useAuth()
  const router = useRouter()

  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusError, setStatusError] = useState<string | null>(null)

  const [operationLog, setOperationLog] = useState<OperationLog[]>([])
  const [actionLoading, setActionLoading] = useState<Record<ActionKey, boolean>>({
    backup: false,
    rls: false,
    vacuum: false,
    errorProbe: false,
  })

  useEffect(() => {
    if (!loading && (!user || userType !== 'admin')) {
      router.push('/login')
    }
  }, [loading, user, userType, router])

  const appendLog = (entry: Omit<OperationLog, 'id' | 'timestamp'>) => {
    const newEntry: OperationLog = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    }
    setOperationLog((prev) => [newEntry, ...prev].slice(0, 12))
  }

  const refreshStatus = async () => {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const response = await fetch('/api/admin/database/status')
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to fetch database status')
      }
      setStatus(payload.data as DatabaseStatus)
    } catch (error) {
      console.error('[admin/database] status fetch failed', error)
      setStatusError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    if (user && userType === 'admin') {
      refreshStatus()
    }
  }, [user, userType])

  const handleAction = async (action: ActionKey) => {
    const config = ACTION_CONFIG[action]
    if (!config) return

    if (config.confirm && typeof window !== 'undefined') {
      const confirmed = window.confirm(config.confirm)
      if (!confirmed) {
        return
      }
    }

    setActionLoading((prev) => ({ ...prev, [action]: true }))

    appendLog({
      message: `${config.title} initiated`,
      detail: 'Operation started. Monitoring progress…',
      level: 'info',
    })

    try {
      const response = await fetch(config.endpoint, { method: 'POST' })
      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unknown error')
      }

      appendLog({
        message: `${config.title} completed`,
        detail: config.successDetail,
        level: config.level,
      })

      refreshStatus()
    } catch (error) {
      console.error(`[admin/database] ${config.title} failed`, error)
      appendLog({
        message: `${config.title} failed`,
        detail: error instanceof Error ? error.message : 'Unknown error',
        level: 'error',
      })
    } finally {
      setActionLoading((prev) => ({ ...prev, [action]: false }))
    }
  }

  const statusCards = status?.statusCards ?? []
  const maintenanceTasks = status?.maintenance ?? []
  const rlsPolicies = status?.rlsPolicies ?? []

  const metrics = useMemo(
    () => [
      {
        label: 'Total Users',
        value: status?.metrics.totalUsers ?? 0,
      },
      {
        label: 'Collections',
        value: status?.metrics.totalCollections ?? 0,
      },
      {
        label: 'Photos',
        value: status?.metrics.totalPhotos ?? 0,
      },
      {
        label: 'Storage Used',
        value: formatBytes(status?.metrics.storageUsedBytes ?? 0),
      },
    ],
    [status?.metrics],
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Authenticating…</span>
        </div>
      </div>
    )
  }

  if (!user || userType !== 'admin') {
    return null
  }

  return (
    <AccessGuard requiredAccess="canAccessAdminDashboard">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 border-border">
          <div className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Database className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Database Management</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor storage, backups, and RLS policies for PhotoVault
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Admin Access
            </Badge>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Status Overview */}
            <Card className="border-2 border-blue-100 shadow-sm">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Infrastructure Status
                  </CardTitle>
                  <CardDescription>
                    Key health indicators from Supabase, storage, and security layers
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {statusLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing
                    </span>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={refreshStatus} aria-label="Refresh database status">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {statusError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to fetch live status: {statusError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                      <p className="mt-2 text-xl font-semibold text-slate-800">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {statusCards.map((card) => {
                    const IconComponent = ICON_MAP[card.icon as keyof typeof ICON_MAP] ?? Server
                    return (
                      <div key={card.title} className={`${card.bg} rounded-lg p-4 flex flex-col gap-2`}>
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-5 w-5 ${card.color}`} />
                          <span className="font-semibold text-slate-800">{card.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                        <span className={`text-sm font-medium ${card.color}`}>{card.status}</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Tools */}
            <Card className="shadow-sm bg-white/95">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-slate-700" />
                  Maintenance Tools
                </CardTitle>
                <CardDescription>
                  Run high-level administrative jobs executed by Supabase functions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {(
                    [
                      { key: 'backup', lastRun: 'Last manual backup: Oct 29, 21:04 UTC', icon: Archive },
                      { key: 'rls', lastRun: 'Last audit: Nov 6, 18:32 UTC', icon: ShieldCheck },
                      { key: 'vacuum', lastRun: 'Last vacuum: Nov 3, 04:45 UTC', icon: HardDrive },
                      { key: 'errorProbe', lastRun: 'Last incident: None reported', icon: AlertTriangle },
                    ] as Array<{ key: ActionKey; lastRun: string; icon: ComponentType<{ className?: string }> }>
                  ).map(({ key, lastRun, icon: IconComponent }) => {
                    const config = ACTION_CONFIG[key]
                    const isLoadingAction = actionLoading[key]
                    return (
                      <Card key={key} className="border border-slate-200 bg-card">
                        <CardHeader>
                          <CardTitle className="text-base">{config.title}</CardTitle>
                          <CardDescription>{config.successDetail}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <IconComponent className="h-4 w-4 text-blue-500" />
                            {lastRun}
                          </div>
                          <Button
                            className="w-full"
                            variant={config.variant ?? 'default'}
                            disabled={isLoadingAction}
                            onClick={() => handleAction(key)}
                            aria-label={config.ariaLabel}
                          >
                            {isLoadingAction ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running…
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {config.title}
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recent Operations</h3>
                  <div
                    className="bg-slate-900/90 text-slate-100 rounded-lg p-4 space-y-2 text-sm font-mono"
                    role="log"
                    aria-live="polite"
                  >
                    {operationLog.length === 0 ? (
                      <p className="text-muted-foreground">No manual operations recorded this session.</p>
                    ) : (
                      operationLog.map((log) => (
                        <div key={log.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span>
                              [
                              {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                              ] {log.message}
                            </span>
                            <span
                              className={`text-xs uppercase tracking-wide ${
                                log.level === 'success'
                                  ? 'text-emerald-300'
                                  : log.level === 'warning'
                                  ? 'text-amber-300'
                                  : log.level === 'error'
                                  ? 'text-red-300'
                                  : 'text-blue-300'
                              }`}
                            >
                              {log.level}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{log.detail}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policies & Maintenance */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Row Level Security Overview
                  </CardTitle>
                  <CardDescription>
                    Critical access policies enforced in Supabase for PhotoVault.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rlsPolicies.map((policy) => (
                    <div key={policy.name} className="border border-slate-200 rounded-lg p-4 bg-white/70">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-800">{policy.name}</h4>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          {policy.status}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                        <Database className="h-3 w-3" />
                        Table: {policy.table}
                      </div>
                    </div>
                  ))}
                  <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/60 p-4 text-sm text-purple-700">
                    Ensure new tables storing customer data define explicit RLS policies before promotion to production.
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-slate-700" />
                    Maintenance Schedule
                  </CardTitle>
                  <CardDescription>
                    Recurring jobs that keep PhotoVault performant and compliant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {maintenanceTasks.map((task) => {
                    const IconComponent = ICON_MAP[task.icon as keyof typeof ICON_MAP] ?? Activity
                    return (
                      <div
                        key={task.title}
                        className="rounded-lg border border-slate-200 bg-card p-4 flex items-start gap-3"
                      >
                        <IconComponent className="h-5 w-5 text-blue-500 mt-1" />
                        <div>
                          <h4 className="font-semibold text-slate-800">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">Runs: {task.schedule}</p>
                          <p className="text-sm text-muted-foreground">{task.notes}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-700">
                    For emergency maintenance, coordinate downtime announcements with Customer Success and update the status page before executing.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AccessGuard>
  )
}

