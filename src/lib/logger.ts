/**
 * Centralized logger with sanitization for sensitive data.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Payment failed', { error, stripeCustomerId })
 *
 * Log levels:
 *   - debug: Development only, verbose details
 *   - info: General operational info (dev + production if LOG_LEVEL=info)
 *   - warn: Warning conditions
 *   - error: Error conditions (always logged)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogData = Record<string, unknown> | Error | string | unknown

// Fields that should be redacted from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'card_number',
  'cvv',
  'ssn',
  'api_key',
  'apiKey',
  'stripe_secret',
  'webhook_secret',
  'access_token',
  'refresh_token',
  'private_key',
]

// Patterns to redact (e.g., email addresses, card numbers)
const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Credit card numbers (13-19 digits)
  { pattern: /\b\d{13,19}\b/g, replacement: '[CARD_REDACTED]' },
  // JWT tokens
  { pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*/g, replacement: '[JWT_REDACTED]' },
  // Stripe secret keys
  { pattern: /sk_(test|live)_[A-Za-z0-9]+/g, replacement: '[STRIPE_KEY_REDACTED]' },
  // Webhook secrets
  { pattern: /whsec_[A-Za-z0-9]+/g, replacement: '[WEBHOOK_SECRET_REDACTED]' },
]

/**
 * Recursively sanitize an object, redacting sensitive fields
 */
function sanitize(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]'

  if (obj === null || obj === undefined) return obj

  if (typeof obj === 'string') {
    let result = obj
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      result = result.replace(pattern, replacement)
    }
    return result
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') return obj

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: sanitize(obj.message, depth + 1),
      stack: process.env.NODE_ENV === 'development' ? obj.stack : undefined,
    }
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, depth + 1))
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]'
      } else {
        result[key] = sanitize(value, depth + 1)
      }
    }
    return result
  }

  return String(obj)
}

const isDev = process.env.NODE_ENV === 'development'
const logLevel = process.env.LOG_LEVEL || (isDev ? 'debug' : 'error')

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[logLevel as LogLevel]
}

function formatLog(level: LogLevel, message: string, data?: LogData): string {
  const timestamp = new Date().toISOString()
  const sanitizedData = data !== undefined ? sanitize(data) : undefined

  if (isDev) {
    // Human-readable format for development
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    if (sanitizedData !== undefined) {
      const dataStr = typeof sanitizedData === 'object'
        ? JSON.stringify(sanitizedData, null, 2)
        : String(sanitizedData)
      return `${prefix} ${message} ${dataStr}`
    }
    return `${prefix} ${message}`
  }

  // Structured JSON for production (easier to parse in log aggregators)
  const logObj: Record<string, unknown> = {
    ts: timestamp,
    level,
    msg: message,
  }

  if (sanitizedData !== undefined) {
    if (typeof sanitizedData === 'object' && sanitizedData !== null) {
      Object.assign(logObj, sanitizedData)
    } else {
      logObj.data = sanitizedData
    }
  }

  return JSON.stringify(logObj)
}

export const logger = {
  /**
   * Debug level - development only, verbose details
   */
  debug: (message: string, data?: LogData): void => {
    if (shouldLog('debug')) {
      console.log(formatLog('debug', message, data))
    }
  },

  /**
   * Info level - general operational information
   */
  info: (message: string, data?: LogData): void => {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, data))
    }
  },

  /**
   * Warn level - warning conditions
   */
  warn: (message: string, data?: LogData): void => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, data))
    }
  },

  /**
   * Error level - error conditions (always logged)
   */
  error: (message: string, data?: LogData): void => {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, data))
    }
  },
}

export default logger
