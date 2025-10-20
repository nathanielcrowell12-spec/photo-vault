/**
 * API Constants
 * Centralized constants for API routes to improve maintainability
 */

// Timeout constants
export const HEALTH_CHECK_TIMEOUT_MS = 5000
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000

// Query limits
export const HEALTH_CHECK_QUERY_LIMIT = 1
export const DEFAULT_PAGE_LIMIT = 50
export const MAX_UPLOAD_SIZE_MB = 100

// Random ID generation constants
export const RANDOM_ID_BASE = 36
export const RANDOM_ID_SUBSTRING_LENGTH = 7

// System metrics constants
export const DEFAULT_UPTIME_PERCENTAGE = 99.9
export const DEFAULT_RESPONSE_TIME_MS = 45
export const MAX_PHOTOS_THRESHOLD = 1000

// File processing constants
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

// Error codes
export const ERROR_CODES = {
  HELM_METRICS_SEND_FAILED: 'HELM_METRICS_SEND_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const

/**
 * Generate a random ID string
 */
export function generateRandomId(): string {
  return Math.random().toString(RANDOM_ID_BASE).substring(RANDOM_ID_SUBSTRING_LENGTH)
}
