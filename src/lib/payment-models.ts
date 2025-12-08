export interface PaymentOption {
  id: string
  name: string
  description: string
  price: number
  duration: number // in months
  photographer_commission: number // percentage (0-100)
  gallery_status: 'active' | 'inactive'
  reactivation_fee: number
  commission_applies: boolean
  terms: string[]
}

export interface ClientPayment {
  id: string
  client_id: string
  photographer_id: string
  gallery_id: string
  payment_option_id: string
  amount_paid: number
  payment_date: string
  expiry_date: string
  status: 'active' | 'inactive' | 'expired'
  commission_paid: number
  reactivation_count: number
  last_reactivation_date: string | null
  new_session_with_photographer: boolean // New session resets commission cycle
  new_session_date: string | null
}

export const PAYMENT_OPTIONS: PaymentOption[] = [
  // ============================================================================
  // STORAGE PACKAGES (with prepaid period, then $8/month)
  // ============================================================================
  {
    id: 'year_package',
    name: 'Year Package',
    description: 'Client pays $100 upfront for 12 months, then $8/month ongoing',
    price: 100,
    duration: 12, // 12 months prepaid
    photographer_commission: 50, // 50% = $50
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: true,
    terms: [
      'Client pays $100 upfront for 12 months gallery access',
      'Photographer receives $50 commission (50%)',
      'After 12 months, $8/month billing starts automatically',
      'Photographer receives $4/month passive commission (50%)',
      'Can be bundled with shoot fee in All-In-One pricing'
    ]
  },
  {
    id: 'six_month_package',
    name: '6-Month Package',
    description: 'Client pays $50 upfront for 6 months, then $8/month ongoing',
    price: 50,
    duration: 6, // 6 months prepaid
    photographer_commission: 50, // 50% = $25
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: true,
    terms: [
      'Client pays $50 upfront for 6 months gallery access',
      'Photographer receives $25 commission (50%)',
      'After 6 months, $8/month billing starts automatically',
      'Photographer receives $4/month passive commission (50%)',
      'Can be bundled with shoot fee in All-In-One pricing'
    ]
  },
  {
    id: 'six_month_trial',
    name: '6-Month Trial',
    description: 'Client pays $20 for 6 months access, then gallery expires',
    price: 20,
    duration: 6,
    photographer_commission: 50, // 50% = $10
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: true,
    terms: [
      'Client pays $20 for 6-month trial access',
      'Photographer receives $10 commission (50%)',
      'Gallery becomes inactive after 6 months',
      'No automatic monthly billing - client must reactivate or upgrade',
      'For clients who don\'t want subscription model'
    ]
  },
  // ============================================================================
  // SHOOT ONLY (No storage package - limited time access)
  // ============================================================================
  {
    id: 'shoot_only',
    name: 'Shoot Only',
    description: 'No storage package - gallery access until all photos downloaded or 90 days max',
    price: 0, // No storage fee
    duration: 3, // 90 days max
    photographer_commission: 0, // No storage = no commission
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: false,
    terms: [
      'No storage package included - shoot fee only',
      'Gallery access until all photos downloaded OR 90 days (whichever first)',
      'PhotoVault receives $0 from this option',
      'Photographer keeps 100% of shoot fee (minus Stripe fees)',
      'Client can upgrade to storage package anytime before expiration',
      'After expiration, client must pay reactivation fee + choose storage package'
    ]
  },
  // ============================================================================
  // INTERNAL OPTIONS (used by system, not shown to photographers in UI)
  // ============================================================================
  {
    id: 'ongoing_monthly',
    name: 'Ongoing Monthly - Year 2+',
    description: 'Client pays $8/month ongoing after prepaid period - $4/month passive commission',
    price: 8,
    duration: 999, // Ongoing monthly
    photographer_commission: 50, // $4/month commission
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: true,
    terms: [
      'Automatically starts after prepaid period ends',
      'Client pays PhotoVault $8/month ongoing',
      'Photographer receives $4/month passive commission (50%)',
      'Automatic monthly billing',
      'Gallery stays active as long as payments continue',
      'Passive income for photographer',
      'Commission stops if inactive for 6+ months and reactivated'
    ]
  },
  {
    id: 'photovault_direct_monthly',
    name: 'PhotoVault Direct Monthly',
    description: 'Monthly subscription with 100% revenue to PhotoVault - no photographer commission',
    price: 8,
    duration: 999, // Ongoing monthly
    photographer_commission: 0, // 100% to PhotoVault
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: false,
    terms: [
      'Client pays $8/month directly to PhotoVault',
      '100% of revenue goes to PhotoVault - no photographer commission',
      'Used for: orphaned clients (photographer left platform)',
      'Used for: direct signups (no photographer referral)',
      'Used for: family accounts (collecting photos from various sources)',
      'Used for: clients who reactivate but photographer is no longer active',
      'Gallery stays active as long as payments continue'
    ]
  },
  {
    id: 'reactivation_fee',
    name: 'Reactivation Fee',
    description: 'One-time fee to reactivate archived gallery - 100% to PhotoVault',
    price: 20,
    duration: 1, // Opens door for 1 month - client then chooses to resume $8/mo or download and leave
    photographer_commission: 0, // NO commission - this is a service fee
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: false,
    terms: [
      'Client pays $20 reactivation fee to PhotoVault (100% to PhotoVault, no commission)',
      'Gallery becomes active for 1 month',
      'Client then chooses: resume $8/month subscription OR download photos and leave',
      'If client resumes $8/month, standard 50/50 commission split applies going forward',
      'Reactivation fee is a service fee - photographer should maintain better client relations',
      'This is the "door opener" - not a storage package'
    ]
  }
]

export function calculateCommission(
  paymentOption: PaymentOption,
  clientPayment: ClientPayment
): number {
  // Commission resets if client has new session with photographer
  if (clientPayment.new_session_with_photographer) {
    return (paymentOption.price * paymentOption.photographer_commission) / 100
  }

  // No commission if client has been inactive for 6+ months and reactivated
  if (clientPayment.reactivation_count > 0 && !paymentOption.commission_applies) {
    return 0
  }

  // No commission if gallery was inactive for 6+ months
  if (clientPayment.status === 'expired' && clientPayment.reactivation_count > 0) {
    return 0
  }

  return (paymentOption.price * paymentOption.photographer_commission) / 100
}

export function getPaymentOptionById(id: string): PaymentOption | undefined {
  return PAYMENT_OPTIONS.find(option => option.id === id)
}

/**
 * Get payment options available for photographers to offer clients
 * These are the packages photographers can select when creating galleries
 */
export function getPhotographerPaymentOptions(): PaymentOption[] {
  return PAYMENT_OPTIONS.filter(option =>
    option.id === 'year_package' ||
    option.id === 'six_month_package' ||
    option.id === 'six_month_trial' ||
    option.id === 'shoot_only'
  )
}

// Alias for backward compatibility
export const getDefaultPaymentOptions = getPhotographerPaymentOptions

/**
 * Get internal system payment options (not shown to photographers)
 */
export function getInternalPaymentOptions(): PaymentOption[] {
  return PAYMENT_OPTIONS.filter(option =>
    option.id === 'ongoing_monthly' ||
    option.id === 'photovault_direct_monthly' ||
    option.id === 'reactivation_fee'
  )
}

// ============================================================================
// ALL-IN-ONE DYNAMIC PRICING (Phase 2)
// ============================================================================

export interface AllInOnePricing {
  payment_option_id: string      // Which storage package (year_package, six_month_package, six_month_trial, shoot_only)
  shoot_fee: number              // Photographer's custom shoot fee (e.g., $2500)
  storage_fee: number            // From payment option ($100, $50, $20, or $0)
  total_amount: number           // What client pays (shoot_fee + storage_fee)
  photographer_receives: number  // shoot_fee + storage_commission (calculated)
  photovault_receives: number    // storage_fee - storage_commission (calculated)
  stripe_fees_estimate: number   // ~2.9% + $0.30 (paid by photographer)
}

/**
 * Calculate All-In-One pricing breakdown
 *
 * @param shootFee - Photographer's session fee (e.g., $2500)
 * @param paymentOptionId - Storage package ID
 * @returns Complete pricing breakdown
 */
export function calculateAllInOnePricing(
  shootFee: number,
  paymentOptionId: string
): AllInOnePricing | null {
  const paymentOption = getPaymentOptionById(paymentOptionId)
  if (!paymentOption) return null

  const storageFee = paymentOption.price
  const totalAmount = shootFee + storageFee

  // Storage commission (50% of storage fee goes to photographer)
  const storageCommission = (storageFee * paymentOption.photographer_commission) / 100

  // Photographer receives: full shoot fee + storage commission
  const photographerReceives = shootFee + storageCommission

  // PhotoVault receives: storage fee - commission
  const photovaultReceives = storageFee - storageCommission

  // Stripe fees: ~2.9% + $0.30 (paid from photographer's portion)
  const stripeFees = (totalAmount * 0.029) + 0.30

  return {
    payment_option_id: paymentOptionId,
    shoot_fee: shootFee,
    storage_fee: storageFee,
    total_amount: totalAmount,
    photographer_receives: photographerReceives,
    photovault_receives: photovaultReceives,
    stripe_fees_estimate: Math.round(stripeFees * 100) / 100
  }
}

/**
 * Get a user-friendly description of a payment option for gallery creation UI
 */
export function getPaymentOptionSummary(paymentOptionId: string): string {
  const option = getPaymentOptionById(paymentOptionId)
  if (!option) return 'Unknown package'

  switch (paymentOptionId) {
    case 'year_package':
      return '$100 upfront (12 months), then $8/month - You earn $50 now + $4/month'
    case 'six_month_package':
      return '$50 upfront (6 months), then $8/month - You earn $25 now + $4/month'
    case 'six_month_trial':
      return '$20 one-time (6 months, no renewal) - You earn $10'
    case 'shoot_only':
      return 'No storage fee - Gallery expires after download or 90 days'
    default:
      return option.description
  }
}

export interface PhotographerSubscription {
  monthly_fee: number // $22/month
  features: string[]
  commission_program: boolean
  free_trial_days: number
}

export interface CommissionRules {
  photographer_commission_rate: number // 50%
  commission_cutoff_months: number // 6 months
  reactivation_fee: number // $8/month
  inactive_gallery_period: number // 6 months
  photographer_subscription_fee: number // $22/month
  terms: string[]
}

export const PHOTOGRAPHER_SUBSCRIPTION: PhotographerSubscription = {
  monthly_fee: 22,
  features: [
    'Unlimited client galleries',
    'Professional photo sharing platform',
    'Client invitation system',
    'Revenue tracking dashboard',
    'Advanced analytics and reporting',
    'PDF report generation',
    'Email report automation',
    'Commission tracking system',
    'Professional CMS integration ready',
    'Mobile-responsive client galleries',
    'Branded gallery presentation',
    'Automated payment reminders'
  ],
  commission_program: true,
  free_trial_days: 0
}

export const COMMISSION_RULES: CommissionRules = {
  photographer_commission_rate: 50,
  commission_cutoff_months: 6,
  reactivation_fee: 8,
  inactive_gallery_period: 6,
  photographer_subscription_fee: 22,
  terms: [
    'Photographer pays $22/month for PhotoVault platform access',
    'Year 1: Client pays $100 upfront → Photographer gets $50 commission',
    'Year 2+: Client pays $8/month ongoing → Photographer gets $4/month passive commission',
    'Commission model: $100 upfront + $8/month ongoing = $50 + $4/month passive income',
    'PhotoVault handles all billing - photographer creates account, PhotoVault sends payment reminders',
    'Replaces photographer\'s existing photo sharing software (Pixieset, ShootProof, etc.)',
    'Professional CMS integration ready - database designed for easy transfer',
    'Commission stops if client gallery is inactive for 6+ months',
    'Reactivated galleries after 6+ months of inactivity belong to PhotoVault',
    'No commission applies to reactivated galleries',
    'Gallery becomes inactive after 6 months of non-payment',
    'Client can reactivate inactive gallery for $8/month',
    'NEW SESSION RULE: If inactive client books new photo session, commission cycle resets',
    'New session with photographer restores $4/month commission for that client',
    'This incentivizes photographers to maintain long-term client relationships',
    'REACTIVATION FEE: $20 one-time fee to reactivate archived gallery',
    'Reactivation fee is 100% PhotoVault revenue - NO photographer commission',
    'This is a service fee - photographers should maintain better client relations to avoid this',
    'After paying $20, client has 1 month to choose: resume $8/month OR download and leave',
    'If client resumes $8/month, standard 50/50 split applies going forward ($4 each)',
    'CROSS-PHOTOGRAPHER COMMISSION: New photographer gets $50 new customer commission',
    'PhotoVault keeps $50 from new session, original photographer keeps $4/month recurring',
    'This creates network effect - all photographers benefit from local photo network',
    'Cancel anytime',
    'FAMILY ACCOUNTS: One login per family, unlimited galleries, $8/month if no photographer',
    'DIRECT-TO-PHOTOGRAPHER CONVERSION: When a Direct Monthly client ($8/mo, 100% PhotoVault) books with a photographer:',
    '  1. Client becomes associated with photographer (primary_photographer_id set)',
    '  2. Stripe subscription swaps from Direct Monthly to Client Monthly (same $8, but now 50/50 split)',
    '  3. Photographer earns $4/month going forward',
    '  4. If upfront package purchased, photographer gets 50% of that too ($50 or $25)',
    '  5. Conversion logged in photographer_succession_log for audit trail',
    'GRACE PERIOD PAYMENT RESUMPTION: If client resumes paying during grace period (e.g., 4 months into 6-month grace), no back pay is due - monthly payments simply restart',
    'MULTI-GALLERY CORE FEATURE: Customers collect photos from various local photographers',
    'PHOTOGRAPHER TERMINATION: Clean break - clients become PhotoVault clients',
    'BILLING DISPUTES: Photographer handles first, shared loss if refund required',
    'UNDEFINED SCENARIOS: Any scenarios not explicitly defined will be worked through by all parties (client, photographer, PhotoVault)',
    'PhotoVault has final decision-making authority in disputes',
    'New rules added to terms based on real-world cases to ensure fair, transparent evolution'
  ]
}
