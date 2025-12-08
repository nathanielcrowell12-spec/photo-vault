/**
 * Access Control Utilities for PhotoVault
 * Client-compatible functions for user access and routing
 * 
 * Note: For server-side subscription access control, use subscription-access.ts
 */

// Admin email addresses that have full access
const ADMIN_EMAILS = [
  'nathaniel.crowell12@gmail.com'
]

export type UserType = 'client' | 'photographer' | 'admin' | null

/**
 * Check if a user is an admin based on email and user type
 */
export function isAdminUser(email: string | null, userType: UserType): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase()) || userType === 'admin'
}

/**
 * Validate user type for signup/login
 */
export function validateUserType(
  userType: UserType,
  email: string | null
): { valid: boolean; message?: string } {
  // Admins can have any user type
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
    return { valid: true }
  }

  // Valid user types
  if (userType === 'client' || userType === 'photographer') {
    return { valid: true }
  }

  // Admin type requires admin email
  if (userType === 'admin') {
    if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
      return { valid: true }
    }
    return { valid: false, message: 'Admin access not authorized for this email' }
  }

  return { valid: false, message: 'Invalid user type' }
}

/**
 * Get the appropriate dashboard route for a user type
 */
export function getDashboardRoute(userType: UserType): string {
  switch (userType) {
    case 'admin':
      return '/admin/dashboard'
    case 'photographer':
      return '/photographer/dashboard'
    case 'client':
      return '/client/dashboard'
    default:
      return '/dashboard'
  }
}

/**
 * Get access rules for a user based on email and user type
 */
export function getUserAccessRules(email: string | null, userType: UserType) {
  const isAdmin = isAdminUser(email, userType)
  
  return {
    // Page access
    canAccessAdminDashboard: isAdmin,
    canAccessPhotographerDashboard: isAdmin || userType === 'photographer',
    canAccessClientDashboard: isAdmin || userType === 'client',
    
    // Feature access
    canManageUsers: isAdmin,
    canManagePhotographers: isAdmin,
    canManageClients: isAdmin || userType === 'photographer',
    canViewAnalytics: isAdmin || userType === 'photographer',
    canManageGalleries: isAdmin || userType === 'photographer',
    canViewGalleries: true, // Everyone can view galleries they have access to
    canUploadPhotos: isAdmin || userType === 'photographer',
    canDownloadPhotos: true, // Clients with valid subscriptions can download
    
    // Admin-only features
    canAccessSystemSettings: isAdmin,
    canViewAllUsers: isAdmin,
    canImpersonateUsers: isAdmin,
    canManagePayments: isAdmin,
    canViewAllCommissions: isAdmin,
    
    // Photographer-specific
    canInviteClients: userType === 'photographer',
    canSetPricing: userType === 'photographer',
    canConnectStripe: userType === 'photographer',
    canViewOwnCommissions: userType === 'photographer',
  }
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(email: string | null, userType: UserType, route: string): boolean {
  const rules = getUserAccessRules(email, userType)
  
  // Admin routes
  if (route.startsWith('/admin')) {
    return rules.canAccessAdminDashboard
  }
  
  // Photographer routes
  if (route.startsWith('/photographer')) {
    return rules.canAccessPhotographerDashboard
  }
  
  // Client routes
  if (route.startsWith('/client')) {
    return rules.canAccessClientDashboard
  }
  
  // Public routes
  return true
}
