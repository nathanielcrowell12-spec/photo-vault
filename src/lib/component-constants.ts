/**
 * Frontend Component Constants
 * Centralized constants for React components to improve maintainability
 */

// Display constants
export const API_KEY_DISPLAY_LENGTH = 20

// Navigation constants
export const NAVIGATION_ROUTES = {
  CLIENT_IMPORT: '/client/import',
  CLIENT_UPLOAD: '/client/upload'
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
