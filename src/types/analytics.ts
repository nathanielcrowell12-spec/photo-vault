/**
 * PostHog Analytics Event Types
 *
 * STRICT TYPE DEFINITIONS for all analytics events.
 * This prevents inconsistent property naming (gallery_id vs galleryId vs GalleryId).
 *
 * If it's not defined here, it doesn't get tracked.
 */

// ==========================================
// BASE PROPERTIES
// ==========================================

/** Base properties included in ALL events */
interface BaseEventProperties {
  timestamp?: string // ISO 8601, auto-added by tracking functions
  session_id?: string // For anonymous users
}

/** Properties for authenticated user events */
interface AuthenticatedEventProperties extends BaseEventProperties {
  user_id?: string // Added automatically by PostHog identify
}

// ==========================================
// PHOTOGRAPHER JOURNEY EVENTS
// Server-side tracking required for most
// ==========================================

export interface PhotographerSignedUpEvent extends AuthenticatedEventProperties {
  signup_method: 'email' | 'google' | 'apple'
  referral_source?: string
}

export interface PhotographerStartedOnboardingEvent extends AuthenticatedEventProperties {
  time_from_signup_seconds: number
}

export interface PhotographerCompletedOnboardingEvent extends AuthenticatedEventProperties {
  time_from_signup_seconds: number
  steps_completed: number
}

export interface PhotographerSkippedOnboardingEvent extends AuthenticatedEventProperties {
  step_skipped_at: string
  time_from_signup_seconds: number
}

export interface PhotographerConnectedStripeEvent extends AuthenticatedEventProperties {
  time_from_signup_seconds: number
  is_first_connection: boolean
}

export interface PhotographerUploadedFirstPhotoEvent extends AuthenticatedEventProperties {
  time_from_signup_seconds: number
  file_size_bytes?: number
}

export interface PhotographerCreatedGalleryEvent extends AuthenticatedEventProperties {
  gallery_id: string
  is_first_gallery: boolean
  photo_count: number
  time_from_signup_seconds: number
}

export interface PhotographerInvitedClientEvent extends AuthenticatedEventProperties {
  gallery_id: string
  client_email?: string
  is_first_client: boolean
  invite_method: 'email' | 'link'
  time_from_signup_seconds: number
}

export interface PhotographerReceivedFirstPaymentEvent extends AuthenticatedEventProperties {
  amount_cents: number
  client_id: string
  gallery_id: string
  time_from_signup_seconds: number
}

export interface PhotographerChurnedEvent extends AuthenticatedEventProperties {
  tenure_days: number
  total_revenue_cents: number
  client_count: number
  gallery_count: number
  churn_reason?: string
}

// ==========================================
// CLIENT JOURNEY EVENTS
// Mixed server/client tracking
// ==========================================

export interface ClientClickedInviteLinkEvent extends BaseEventProperties {
  gallery_id: string
  photographer_id: string
  invite_token?: string
}

export interface ClientViewedGalleryEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  photo_count: number
  duration_seconds?: number // Added on page leave
}

export interface ClientCreatedAccountEvent extends AuthenticatedEventProperties {
  gallery_id?: string
  photographer_id?: string
  signup_method: 'email' | 'google' | 'apple'
}

export interface ClientStartedPaymentEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  plan_type: 'annual' | 'monthly' | '6month'
  amount_cents: number
}

export interface ClientPaymentCompletedEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  plan_type: 'annual' | 'monthly' | '6month'
  amount_cents: number
  is_first_payment: boolean
}

export interface ClientPaymentFailedEvent extends AuthenticatedEventProperties {
  gallery_id?: string
  photographer_id?: string
  plan_type?: 'annual' | 'monthly' | '6month'
  amount_cents?: number
  failure_reason: string
}

export interface ClientDownloadedPhotoEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  photo_id: string
  is_first_download: boolean
}

export interface ClientSharedGalleryEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  share_method: 'email' | 'link' | 'social'
}

export interface ClientChurnedEvent extends AuthenticatedEventProperties {
  tenure_days: number
  photographer_id?: string
  gallery_count: number
  churn_reason?: string
}

// ==========================================
// ENGAGEMENT EVENTS
// Client-side tracking (okay if some blocked)
// ==========================================

export interface GalleryViewedEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photographer_id: string
  photo_count: number
  is_owner: boolean
}

export interface PhotoFavoritedEvent extends AuthenticatedEventProperties {
  gallery_id: string
  photo_id: string
  photographer_id: string
}

export interface FamilyMemberInvitedEvent extends AuthenticatedEventProperties {
  relationship: string
  is_first_family_invite: boolean
}

export interface FamilyMemberAcceptedEvent extends AuthenticatedEventProperties {
  primary_user_id: string
  relationship: string
}

// ==========================================
// ABANDONMENT EVENTS
// Client-side with cleanup on unmount
// ==========================================

export interface UploadAbandonedEvent extends AuthenticatedEventProperties {
  gallery_id?: string
  photos_uploaded: number
  photos_remaining: number
  time_spent_seconds: number
}

export interface PaymentAbandonedEvent extends AuthenticatedEventProperties {
  gallery_id?: string
  step_abandoned_at: 'plan_selection' | 'payment_form' | 'confirmation'
  plan_type?: 'annual' | 'monthly' | '6month'
  time_spent_seconds: number
}

export interface OnboardingAbandonedEvent extends AuthenticatedEventProperties {
  step_abandoned_at: string
  time_spent_seconds: number
}

// ==========================================
// WARNING EVENTS
// Server-side for critical, client for others
// ==========================================

export interface ErrorEncounteredEvent extends AuthenticatedEventProperties {
  error_type: string
  error_message: string
  page: string
  stack_trace?: string
}

export interface SupportRequestSubmittedEvent extends AuthenticatedEventProperties {
  category: string
  page: string
}

// ==========================================
// PAGE VIEW EVENTS
// Auto-generated by usePageView hook
// ==========================================

export interface PageViewedEvent extends AuthenticatedEventProperties {
  page_name: string
}

export interface PageLeftEvent extends AuthenticatedEventProperties {
  page_name: string
  duration_seconds: number
}

// ==========================================
// EVENT NAME CONSTANTS
// Use these instead of string literals
// ==========================================

export const EVENTS = {
  // Photographer journey (SERVER-SIDE)
  PHOTOGRAPHER_SIGNED_UP: 'photographer_signed_up',
  PHOTOGRAPHER_STARTED_ONBOARDING: 'photographer_started_onboarding',
  PHOTOGRAPHER_COMPLETED_ONBOARDING: 'photographer_completed_onboarding',
  PHOTOGRAPHER_SKIPPED_ONBOARDING: 'photographer_skipped_onboarding',
  PHOTOGRAPHER_CONNECTED_STRIPE: 'photographer_connected_stripe',
  PHOTOGRAPHER_UPLOADED_FIRST_PHOTO: 'photographer_uploaded_first_photo',
  PHOTOGRAPHER_CREATED_GALLERY: 'photographer_created_gallery',
  PHOTOGRAPHER_INVITED_CLIENT: 'photographer_invited_client',
  PHOTOGRAPHER_RECEIVED_FIRST_PAYMENT: 'photographer_received_first_payment',
  PHOTOGRAPHER_CHURNED: 'photographer_churned',

  // Client journey (MIXED)
  CLIENT_CLICKED_INVITE_LINK: 'client_clicked_invite_link',
  CLIENT_VIEWED_GALLERY: 'client_viewed_gallery',
  CLIENT_CREATED_ACCOUNT: 'client_created_account',
  CLIENT_STARTED_PAYMENT: 'client_started_payment',
  CLIENT_PAYMENT_COMPLETED: 'client_payment_completed',
  CLIENT_PAYMENT_FAILED: 'client_payment_failed',
  CLIENT_DOWNLOADED_PHOTO: 'client_downloaded_photo',
  CLIENT_SHARED_GALLERY: 'client_shared_gallery',
  CLIENT_CHURNED: 'client_churned',

  // Engagement (CLIENT-SIDE)
  GALLERY_VIEWED: 'gallery_viewed',
  PHOTO_FAVORITED: 'photo_favorited',
  FAMILY_MEMBER_INVITED: 'family_member_invited',
  FAMILY_MEMBER_ACCEPTED: 'family_member_accepted',

  // Abandonment (CLIENT-SIDE)
  UPLOAD_ABANDONED: 'upload_abandoned',
  PAYMENT_ABANDONED: 'payment_abandoned',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',

  // Warnings (MIXED)
  ERROR_ENCOUNTERED: 'error_encountered',
  SUPPORT_REQUEST_SUBMITTED: 'support_request_submitted',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]

// ==========================================
// TYPE MAPPING (for typed trackEvent)
// ==========================================

export type EventPropertiesMap = {
  [EVENTS.PHOTOGRAPHER_SIGNED_UP]: PhotographerSignedUpEvent
  [EVENTS.PHOTOGRAPHER_STARTED_ONBOARDING]: PhotographerStartedOnboardingEvent
  [EVENTS.PHOTOGRAPHER_COMPLETED_ONBOARDING]: PhotographerCompletedOnboardingEvent
  [EVENTS.PHOTOGRAPHER_SKIPPED_ONBOARDING]: PhotographerSkippedOnboardingEvent
  [EVENTS.PHOTOGRAPHER_CONNECTED_STRIPE]: PhotographerConnectedStripeEvent
  [EVENTS.PHOTOGRAPHER_UPLOADED_FIRST_PHOTO]: PhotographerUploadedFirstPhotoEvent
  [EVENTS.PHOTOGRAPHER_CREATED_GALLERY]: PhotographerCreatedGalleryEvent
  [EVENTS.PHOTOGRAPHER_INVITED_CLIENT]: PhotographerInvitedClientEvent
  [EVENTS.PHOTOGRAPHER_RECEIVED_FIRST_PAYMENT]: PhotographerReceivedFirstPaymentEvent
  [EVENTS.PHOTOGRAPHER_CHURNED]: PhotographerChurnedEvent
  [EVENTS.CLIENT_CLICKED_INVITE_LINK]: ClientClickedInviteLinkEvent
  [EVENTS.CLIENT_VIEWED_GALLERY]: ClientViewedGalleryEvent
  [EVENTS.CLIENT_CREATED_ACCOUNT]: ClientCreatedAccountEvent
  [EVENTS.CLIENT_STARTED_PAYMENT]: ClientStartedPaymentEvent
  [EVENTS.CLIENT_PAYMENT_COMPLETED]: ClientPaymentCompletedEvent
  [EVENTS.CLIENT_PAYMENT_FAILED]: ClientPaymentFailedEvent
  [EVENTS.CLIENT_DOWNLOADED_PHOTO]: ClientDownloadedPhotoEvent
  [EVENTS.CLIENT_SHARED_GALLERY]: ClientSharedGalleryEvent
  [EVENTS.CLIENT_CHURNED]: ClientChurnedEvent
  [EVENTS.GALLERY_VIEWED]: GalleryViewedEvent
  [EVENTS.PHOTO_FAVORITED]: PhotoFavoritedEvent
  [EVENTS.FAMILY_MEMBER_INVITED]: FamilyMemberInvitedEvent
  [EVENTS.FAMILY_MEMBER_ACCEPTED]: FamilyMemberAcceptedEvent
  [EVENTS.UPLOAD_ABANDONED]: UploadAbandonedEvent
  [EVENTS.PAYMENT_ABANDONED]: PaymentAbandonedEvent
  [EVENTS.ONBOARDING_ABANDONED]: OnboardingAbandonedEvent
  [EVENTS.ERROR_ENCOUNTERED]: ErrorEncounteredEvent
  [EVENTS.SUPPORT_REQUEST_SUBMITTED]: SupportRequestSubmittedEvent
}
