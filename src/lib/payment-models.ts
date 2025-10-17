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
  {
    id: 'photographer_billed',
    name: 'Photographer Billed - Annual + Monthly',
    description: 'Client pays $100/year upfront, then $8/month ongoing - $50 + $4/month commission',
    price: 100, // $100 upfront + $8/month ongoing
    duration: 12, // First year
    photographer_commission: 50, // $50 upfront + $4/month ongoing
    gallery_status: 'active',
    reactivation_fee: 8,
    commission_applies: true,
    terms: [
      'Client pays $100 upfront for first year access',
      'Photographer receives $50 commission immediately',
      'After year 1, client pays $8/month ongoing',
      'Photographer receives $4/month passive commission',
      'Gallery access unlocked after upfront payment',
      'Ongoing monthly billing handled automatically',
      'Replaces photographer\'s existing photo sharing software'
    ]
  },
  {
    id: 'six_month_trial',
    name: '6-Month Trial',
    description: 'Client pays $20 for 6 months access, then gallery goes inactive',
    price: 20,
    duration: 6,
    photographer_commission: 50, // $10 commission
    gallery_status: 'active',
    reactivation_fee: 8,
    commission_applies: true,
    terms: [
      'Client pays $20 for 6-month trial access',
      'Photographer receives $10 commission',
      'Gallery becomes inactive after 6 months',
      'For clients who don\'t want subscription model',
      'No ongoing monthly payments required'
    ]
  },
  {
    id: 'ongoing_monthly',
    name: 'Ongoing Monthly - Year 2+',
    description: 'Client pays $8/month ongoing after first year - $4/month passive commission',
    price: 8,
    duration: 999, // Ongoing monthly
    photographer_commission: 50, // $4/month commission
    gallery_status: 'active',
    reactivation_fee: 8,
    commission_applies: true,
    terms: [
      'Client pays PhotoVault $8/month ongoing (after year 1)',
      'Photographer receives $4/month passive commission',
      'Automatic monthly billing',
      'Gallery stays active as long as payments continue',
      'Passive income for photographer',
      'Commission stops if inactive for 6+ months and reactivated'
    ]
  },
  {
    id: 'reactivated_gallery',
    name: 'Reactivated Gallery',
    description: 'Client reactivated after 6+ months of inactivity',
    price: 8,
    duration: 1,
    photographer_commission: 0, // No commission after reactivation
    gallery_status: 'active',
    reactivation_fee: 8,
    commission_applies: false,
    terms: [
      'Client reactivated after 6+ months of gallery inactivity',
      'No photographer commission applies',
      'Client pays $8/month directly to PhotoVault',
      'Gallery remains active as long as payments continue'
    ]
  },
  {
    id: 'family_account_direct',
    name: 'Family Account - Direct',
    description: 'Family account with no photographer involved - unlimited galleries',
    price: 8,
    duration: 999, // Ongoing monthly
    photographer_commission: 0, // No photographer commission
    gallery_status: 'active',
    reactivation_fee: 8,
    commission_applies: false,
    terms: [
      'Family pays $8/month for unlimited galleries',
      'One login per family, unlimited family members',
      'No photographer commission applies',
      'Perfect for families collecting photos from various sources',
      'Unlimited photo storage and galleries',
      'Direct billing to PhotoVault'
    ]
  },
  {
    id: 'reactivation_without_session',
    name: 'Reactivation Without New Session',
    description: 'Client reactivates account without booking new photoshoot',
    price: 20,
    duration: 1, // One-time reactivation fee
    photographer_commission: 50, // 50% commission = $10
    gallery_status: 'active',
    reactivation_fee: 20,
    commission_applies: true,
    terms: [
      'Client went inactive after first paid year (12 months paid + 6 month grace period)',
      'Client pays $20 reactivation fee to PhotoVault',
      'Photographer gets $10 commission from reactivation fee',
      'Then $8/month payments resume with standard $4/month commission to photographer',
      'Photographer never loses the customer - commission continues',
      'No new photoshoot required for reactivation'
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

export function getDefaultPaymentOptions(): PaymentOption[] {
  return PAYMENT_OPTIONS.filter(option => 
    option.id === 'photographer_billed' || 
    option.id === 'six_month_trial' || 
    option.id === 'client_direct_monthly'
  )
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
  free_trial_days: 14
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
    'REACTIVATION WITHOUT NEW SESSION: Client can reactivate after inactivity (12mo paid + 6mo grace) without new photoshoot',
    'Client pays $20 reactivation fee + resumes $8/month payments',
    'Standard commission split applies: Photographer gets $10 from reactivation fee, PhotoVault gets $10',
    'Then ongoing $8/month payments split 50/50: $4 photographer, $4 PhotoVault',
    'Photographer never loses the customer - commission continues on reactivation',
    'CROSS-PHOTOGRAPHER COMMISSION: New photographer gets $50 new customer commission',
    'PhotoVault keeps $50 from new session, original photographer keeps $4/month recurring',
    'This creates network effect - all photographers benefit from local photo network',
    '14-day free trial available for new photographers',
    'FAMILY ACCOUNTS: One login per family, unlimited galleries, $8/month if no photographer',
    'FAMILY-TO-PHOTOGRAPHER CONVERSION: If family (no photographer) later books with PhotoVault photographer, PhotoVault\'s $8/month stops, standard commission applies (photographer gets $50 + $4/month)',
    'GRACE PERIOD PAYMENT RESUMPTION: If client resumes paying during grace period (e.g., 4 months into 6-month grace), no back pay is due - monthly payments simply restart',
    'MULTI-GALLERY CORE FEATURE: Customers collect photos from various local photographers',
    'PHOTOGRAPHER TERMINATION: Clean break - clients become PhotoVault clients',
    'BILLING DISPUTES: Photographer handles first, shared loss if refund required',
    'UNDEFINED SCENARIOS: Any scenarios not explicitly defined will be worked through by all parties (client, photographer, PhotoVault)',
    'PhotoVault has final decision-making authority in disputes',
    'New rules added to terms based on real-world cases to ensure fair, transparent evolution'
  ]
}
