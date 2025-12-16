// Admin-related types shared between API routes and pages
// Import these types in both client components and API routes

// ============================================================
// Leaderboard Types
// ============================================================

export type LeaderboardEntry = {
  rank: number
  photographerId: string
  photographerName: string
  galleryCount: number
  photovaultRevenueCents: number    // What they generated FOR PhotoVault
  photographerEarningsCents: number // What they earned
  transactionCount: number
}

export type LeaderboardResponse = {
  success: boolean
  data?: {
    entries: LeaderboardEntry[]
    period: string
  }
  error?: string
}

// ============================================================
// Transaction Types
// ============================================================

export type Transaction = {
  id: string
  date: string
  clientEmail: string
  paymentType: 'upfront' | 'monthly' | 'reactivation'
  totalPaidCents: number
  photovaultCommissionCents: number
  photographerCommissionCents: number
  status: 'paid' | 'refunded' | 'pending'
  photographerName: string
}

export type TransactionsResponse = {
  success: boolean
  data?: {
    transactions: Transaction[]
    total: number
    page: number
    pageSize: number
  }
  error?: string
}

// ============================================================
// Photographer Types
// ============================================================

export type Photographer = {
  id: string
  name: string
  email: string
  city: string | null
  state: string | null
  paymentStatus: string | null
  galleryCount: number
  clientCount: number
  totalRevenueCents: number
  createdAt: string
}

export type PhotographersResponse = {
  success: boolean
  data?: {
    photographers: Photographer[]
    total: number
    page: number
    pageSize: number
    stats?: {
      totalPhotographers: number
      activeCount: number
      totalGalleries: number
      totalRevenueCents: number
    }
  }
  error?: string
}

// ============================================================
// Client Types
// ============================================================

export type Client = {
  id: string
  name: string
  email: string
  paymentStatus: string | null
  galleryCount: number
  activeSubscriptions: number
  totalSpentCents: number
  createdAt: string
}

export type ClientsResponse = {
  success: boolean
  data?: {
    clients: Client[]
    total: number
    page: number
    pageSize: number
    stats?: {
      totalClients: number
      activeCount: number
      totalSubscriptions: number
      totalSpentCents: number
    }
  }
  error?: string
}
