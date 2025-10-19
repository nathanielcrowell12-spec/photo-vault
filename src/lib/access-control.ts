/**
 * Access Control System for PhotoVault
 * Manages user permissions and dashboard access
 */

export type UserType = 'client' | 'photographer' | 'admin'

export interface AccessRules {
  canAccessAdminDashboard: boolean
  canAccessPhotographerDashboard: boolean
  canAccessClientDashboard: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
}

/**
 * Get access rules for a user
 */
export function getUserAccessRules(userEmail: string | null, userType: UserType | null): AccessRules {
  const isAdmin = userEmail === 'nathaniel.crowell12@gmail.com' && userType === 'admin'
  
  return {
    canAccessAdminDashboard: isAdmin,
    canAccessPhotographerDashboard: userType === 'photographer' || userType === 'admin',
    canAccessClientDashboard: userType === 'client' || userType === 'photographer' || userType === 'admin',
    canManageUsers: isAdmin,
    canViewAnalytics: userType === 'photographer' || userType === 'admin',
    canManageSettings: userType === 'photographer' || userType === 'admin'
  }
}

/**
 * Check if user can access admin features
 */
export function isAdminUser(userEmail: string | null, userType: UserType | null): boolean {
  return userEmail === 'nathaniel.crowell12@gmail.com' && userType === 'admin'
}

/**
 * Get the appropriate dashboard route for a user
 */
export function getDashboardRoute(userType: UserType | null): string {
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
 * Validate user type during signup
 */
export function validateUserType(userType: UserType, userEmail: string): { valid: boolean; message?: string } {
  // Only nathaniel.crowell12@gmail.com can be admin
  if (userType === 'admin' && userEmail !== 'nathaniel.crowell12@gmail.com') {
    return {
      valid: false,
      message: 'Admin access is restricted to authorized users only.'
    }
  }
  
  return { valid: true }
}
