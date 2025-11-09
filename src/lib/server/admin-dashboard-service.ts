'use server'

import { createServerSupabaseClient } from '@/lib/supabase'

type NullableNumber = number | null
type NullableString = string | null

export type AdminDashboardStats = {
  totalUsers: NullableNumber
  activePhotographers: NullableNumber
  monthlyRevenue: NullableNumber
  systemUptime: NullableString
}

export type AdminSystemStatusCard = {
  id: string
  title: string
  state: 'operational' | 'warning' | 'pending' | 'error'
  summary: string
  detail: string
  icon: string
}

export type AdminDashboardStatus = {
  stats: AdminDashboardStats
  statusCards: AdminSystemStatusCard[]
}

type FetchResult<T> = {
  value: T
  error?: Error
}

async function fetchTotalUsers() {
  try {
    const supabase = createServerSupabaseClient()
    const { count, error } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true })

    if (error) throw error
    return { value: count ?? 0 } satisfies FetchResult<number>
  } catch (error) {
    console.error('[admin-dashboard-service] Failed to fetch total users', error)
    return { value: null, error: error instanceof Error ? error : new Error('Unknown error') } satisfies FetchResult<NullableNumber>
  }
}

async function fetchPhotographerCount() {
  try {
    const supabase = createServerSupabaseClient()
    const { count, error } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('user_type', 'photographer')

    if (error) throw error
    return { value: count ?? 0 } satisfies FetchResult<number>
  } catch (error) {
    console.error('[admin-dashboard-service] Failed to fetch photographer count', error)
    return { value: null, error: error instanceof Error ? error : new Error('Unknown error') } satisfies FetchResult<NullableNumber>
  }
}

async function fetchMonthlyRevenue() {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date()
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
    const startISO = startOfMonth.toISOString()
    const endISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
      .from('client_payments')
      .select('amount_paid')
      .gte('payment_date', startISO)
      .lte('payment_date', endISO)
      .eq('status', 'active')

    if (error) throw error

    const total = data?.reduce((sum, row) => sum + (row.amount_paid ?? 0), 0) ?? 0
    return { value: total } satisfies FetchResult<number>
  } catch (error) {
    console.warn('[admin-dashboard-service] Monthly revenue unavailable', error)
    return { value: null, error: error instanceof Error ? error : new Error('Unknown error') } satisfies FetchResult<NullableNumber>
  }
}

function buildStatusCards({
  totalUsers,
  photographers,
}: {
  totalUsers: FetchResult<NullableNumber>
  photographers: FetchResult<NullableNumber>
}): AdminSystemStatusCard[] {
  const hasUserData = totalUsers.error === undefined && totalUsers.value !== null
  const hasPhotographerData = photographers.error === undefined && photographers.value !== null

  return [
    {
      id: 'overall',
      title: 'Platform',
      state: hasUserData && hasPhotographerData ? 'operational' : 'warning',
      summary: hasUserData && hasPhotographerData ? 'Operational' : 'Data incomplete',
      detail: hasUserData && hasPhotographerData
        ? 'Core metrics loaded successfully.'
        : 'Some metrics are unavailable. Check Supabase connections.',
      icon: hasUserData && hasPhotographerData ? 'CheckCircle' : 'AlertTriangle',
    },
    {
      id: 'database',
      title: 'Database',
      state: hasUserData ? 'operational' : 'warning',
      summary: hasUserData ? 'Connected' : 'Needs attention',
      detail: hasUserData
        ? 'Supabase responded to user profile query.'
        : 'Unable to load user profiles. Confirm database connectivity.',
      icon: 'Database',
    },
    {
      id: 'cdn',
      title: 'CDN',
      state: 'pending',
      summary: 'Integration pending',
      detail: 'Connect CDN monitoring to surface delivery health here.',
      icon: 'Globe',
    },
    {
      id: 'performance',
      title: 'Performance',
      state: 'pending',
      summary: 'Manual monitoring',
      detail: 'Hook up performance telemetry to replace this note.',
      icon: 'BarChart3',
    },
  ]
}

export async function fetchAdminDashboardStatus(): Promise<AdminDashboardStatus> {
  const [totalUsers, photographers, revenue] = await Promise.all([
    fetchTotalUsers(),
    fetchPhotographerCount(),
    fetchMonthlyRevenue(),
  ])

  const stats: AdminDashboardStats = {
    totalUsers: totalUsers.value,
    activePhotographers: photographers.value,
    monthlyRevenue: revenue.value,
    systemUptime: '99.9%', // Placeholder until uptime monitoring is integrated
  }

  const statusCards = buildStatusCards({
    totalUsers,
    photographers,
  })

  return { stats, statusCards }
}

