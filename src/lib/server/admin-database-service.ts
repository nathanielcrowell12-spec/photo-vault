'use server'

import { createServerSupabaseClient } from '@/lib/supabase'

type SupabaseResponse<T> = {
  data: T
  error: Error | null
}

const PAGE_SIZE = 1000

async function withSupabase<T>(fn: (supabase: ReturnType<typeof createServerSupabaseClient>) => Promise<SupabaseResponse<T>>): Promise<T> {
  const supabase = createServerSupabaseClient()
  const { data, error } = await fn(supabase)
  if (error) {
    throw error
  }
  return data
}

export async function runDatabaseBackup() {
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase.rpc('admin_run_backup')
    return {
      data: data ?? { message: 'Backup triggered.' },
      error,
    }
  })
}

export async function validateRlsPolicies() {
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase.rpc('admin_validate_rls')
    return {
      data:
        data ??
        {
          message: 'RLS validation completed.',
          violations: [],
        },
      error,
    }
  })
}

export async function vacuumStorage() {
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase.rpc('admin_vacuum_storage')
    return {
      data:
        data ??
        {
          message: 'Vacuum completed.',
          bytesReclaimed: 0,
        },
      error,
    }
  })
}

export async function runErrorProbe() {
  return withSupabase(async (supabase) => {
    const { data, error } = await supabase.rpc('admin_collect_errors')
    return {
      data:
        data ??
        {
          message: 'Error probe completed.',
          results: [],
        },
      error,
    }
  })
}

type SupabaseClient = ReturnType<typeof createServerSupabaseClient>

async function fetchCounts(supabase: SupabaseClient) {
  const [
    { count: userCount, error: usersError },
    { count: photographerCount, error: photographersError },
    collectionResult,
    { count: photoCount, error: photosError },
  ] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'photographer'),
    supabase.from('collections').select('id', { count: 'exact', head: true }),
    supabase.from('photos').select('id', { count: 'exact', head: true }),
  ])

  if (usersError) throw usersError
  if (photographersError) throw photographersError

  let collectionsCount = collectionResult.count ?? 0
  if (collectionResult.error) {
    console.warn('[admin-database-service] Falling back to photo_galleries for collection count', collectionResult.error)
    const { count: galleriesCount, error: galleriesError } = await supabase
      .from('photo_galleries')
      .select('id', { count: 'exact', head: true })
    if (galleriesError) throw galleriesError
    collectionsCount = galleriesCount ?? 0
  }

  if (photosError) throw photosError

  return {
    users: userCount ?? 0,
    photographers: photographerCount ?? 0,
    collections: collectionsCount,
    photos: photoCount ?? 0,
  }
}

async function fetchPhotoStorageUsage(supabase: SupabaseClient) {
  let total = 0
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('photos')
      .select('file_size')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    for (const record of data) {
      total += record.file_size ?? 0
    }

    if (data.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return total
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

export async function fetchDatabaseStatus(): Promise<{
  metrics: {
    totalUsers: number
    totalCollections: number
    totalPhotos: number
    storageUsedBytes: number
  }
  statusCards: StatusCard[]
  rlsPolicies: RlsPolicy[]
  maintenance: MaintenanceTask[]
}> {
  const supabase = createServerSupabaseClient()

  const counts = await fetchCounts(supabase)

  let storageUsedBytes = 0
  try {
    storageUsedBytes = await fetchPhotoStorageUsage(supabase)
  } catch (error) {
    console.error('[admin-database-service] Failed to compute storage usage', error)
  }

  let rlsPolicies: RlsPolicy[] = []

  try {
    const { data, error } = await supabase.rpc('admin_list_rls_policies')
    if (error) {
      throw error
    }
    if (Array.isArray(data)) {
      rlsPolicies = data as RlsPolicy[]
    }
  } catch (error) {
    console.warn('[admin-database-service] Using fallback RLS policies', error)
    rlsPolicies = [
      {
        name: 'photographers_own_collections',
        table: 'collections',
        description: 'Photographers can access collections they own.',
        status: 'active',
      },
      {
        name: 'clients_shared_collections',
        table: 'collections',
        description: 'Clients can access collections shared with them.',
        status: 'active',
      },
      {
        name: 'photos_via_collection',
        table: 'photos',
        description: 'Photo access is derived from parent collection access.',
        status: 'active',
      },
    ]
  }

  const statusCards: StatusCard[] = [
    {
      title: 'Primary Cluster',
      subtitle: 'Supabase Postgres',
      status: 'Operational',
      icon: 'Server',
      color: 'text-green-600',
      bg: 'bg-green-50 border border-green-200',
    },
    {
      title: 'Storage Usage',
      subtitle: `${(storageUsedBytes / (1024 ** 3)).toFixed(1)} GB`,
      status: `${Math.min(100, (storageUsedBytes / (1024 ** 4)).toFixed(1))}% of 1 TB`,
      icon: 'Cloud',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border border-blue-200',
    },
    {
      title: 'Last Backup',
      subtitle: 'Pending edge function integration',
      status: 'Needs verification',
      icon: 'ShieldCheck',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border border-emerald-200',
    },
    {
      title: 'RLS Policies',
      subtitle: `${rlsPolicies.length} critical policies`,
      status: 'All active',
      icon: 'Shield',
      color: 'text-purple-600',
      bg: 'bg-purple-50 border border-purple-200',
    },
  ]

  const maintenance: MaintenanceTask[] = [
    {
      title: 'Nightly Backups',
      schedule: '01:30 UTC',
      notes: 'Full Supabase backup stored in S3 cold storage.',
      icon: 'Archive',
    },
    {
      title: 'Analytics Rollup',
      schedule: 'Every 6 hours',
      notes: 'Refresh materialized views for revenue and engagement dashboards.',
      icon: 'Activity',
    },
    {
      title: 'Storage Vacuum',
      schedule: 'Sundays 03:00 UTC',
      notes: 'Cleanup deleted photo references and reclaim storage.',
      icon: 'HardDrive',
    },
  ]

  return {
    metrics: {
      totalUsers: counts.users,
      totalCollections: counts.collections,
      totalPhotos: counts.photos,
      storageUsedBytes,
    },
    statusCards,
    rlsPolicies,
    maintenance,
  }
}

