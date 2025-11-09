/**
 * Frontend Component Constants
 * Centralized constants for React components to improve maintainability
 */

// Display constants
export const API_KEY_DISPLAY_LENGTH = 20

// Navigation constants
export const NAVIGATION_ROUTES = {
  CLIENT_UPLOAD: '/client/upload',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  PHOTOGRAPHER_DASHBOARD: '/photographer/dashboard',
  CLIENT_DASHBOARD: '/client/dashboard'
} as const

// Gallery constants
export const GALLERY_SORT_OPTIONS = {
  DATE: 'date',
  PHOTOGRAPHER: 'photographer', 
  PLATFORM: 'platform',
  NAME: 'name'
} as const

export const GALLERY_FILTER_OPTIONS = {
  ALL: 'all',
  PIXIESET: 'pixieset',
  SHOOTPROOF: 'shootproof',
  SMUGMUG: 'smugmug'
} as const

export const VIEW_MODE_OPTIONS = {
  GRID: 'grid',
  LIST: 'list'
} as const

// Error messages
export const ERROR_MESSAGES = {
  FETCH_GALLERIES_FAILED: 'Failed to load galleries. Please try again.',
  FETCH_CLIENTS_FAILED: 'Failed to load clients. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.'
} as const

// Toast messages
export const TOAST_MESSAGES = {
  GALLERY_LOADED: 'Galleries loaded successfully',
  CLIENTS_LOADED: 'Clients loaded successfully',
  FETCH_ERROR: 'Failed to load data'
} as const

// Form constants
export const DESCRIPTION_TEXTAREA_ROWS = 3

// Error types for better debugging
export const ERROR_TYPES = {
  FETCH_ERROR: 'fetchError',
  SAVE_ERROR: 'saveError',
  VALIDATION_ERROR: 'validationError'
} as const

// UI Constants
export const UI_CONSTANTS = {
  // Icon sizes
  ICON_SIZE_LARGE: 'h-12 w-12',
  ICON_SIZE_SMALL: 'h-4 w-4',
  
  // Positioning
  BADGE_TOP_RIGHT: 'top-2 right-2',
  
  // Transition durations
  TRANSITION_DURATION_FAST: 'duration-200',
  TRANSITION_DURATION_NORMAL: 'duration-300',
  
  // UI Text
  PHOTOGRAPHER_BY_PREFIX: 'by',
  IMPORT_PHOTOS_TEXT: 'Import Photos',
  EDIT_TEXT: 'Edit'
} as const

// Navigation utilities
export const NavigationUtils = {
  openExternalLink: (url: string, target: string = '_blank') => {
    if (typeof window !== 'undefined') {
      window.open(url, target)
    }
  }
} as const
