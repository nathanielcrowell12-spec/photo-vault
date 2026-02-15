/**
 * Photographer Welcome Email API Route Tests
 *
 * Tests for POST /api/email/photographer-welcome
 *
 * Test Coverage:
 * - Sends welcome email with correct data
 * - Returns 401 when unauthenticated
 * - Returns 400 when photographerEmail is missing
 * - Returns 500 when EmailService fails (accurate error reporting)
 * - Handles malformed JSON gracefully
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================================
// MOCK SETUP - Must be before any imports that use these modules
// ============================================================================

const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
}

const mockSupabase = {
  auth: mockSupabaseAuth,
}

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const { mockSendPhotographerWelcomeEmail } = vi.hoisted(() => ({
  mockSendPhotographerWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/email/email-service', () => ({
  EmailService: {
    sendPhotographerWelcomeEmail: mockSendPhotographerWelcomeEmail,
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockRequest(body: object): NextRequest {
  return {
    json: () => Promise.resolve(body),
  } as unknown as NextRequest
}

function createMalformedRequest(): NextRequest {
  return {
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  } as unknown as NextRequest
}

// ============================================================================
// TESTS
// ============================================================================

describe('POST /api/email/photographer-welcome', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const { POST } = await import('./route')
    const request = createMockRequest({
      photographerName: 'Jane Doe',
      photographerEmail: 'jane@example.com',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
    expect(mockSendPhotographerWelcomeEmail).not.toHaveBeenCalled()
  })

  it('returns 400 when photographerEmail is missing', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'jane@example.com' } },
      error: null,
    })

    const { POST } = await import('./route')
    const request = createMockRequest({
      photographerName: 'Jane Doe',
      // no photographerEmail
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing photographerEmail')
    expect(mockSendPhotographerWelcomeEmail).not.toHaveBeenCalled()
  })

  it('sends welcome email with correct data and returns 200', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'jane@example.com' } },
      error: null,
    })
    mockSendPhotographerWelcomeEmail.mockResolvedValue({ success: true })

    const { POST } = await import('./route')
    const request = createMockRequest({
      photographerName: 'Jane Doe',
      photographerEmail: 'jane@example.com',
      businessName: 'Jane Doe Photography',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSendPhotographerWelcomeEmail).toHaveBeenCalledWith({
      photographerName: 'Jane Doe',
      photographerEmail: 'jane@example.com',
      businessName: 'Jane Doe Photography',
    })
  })

  it('defaults photographerName to "Photographer" when not provided', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'jane@example.com' } },
      error: null,
    })
    mockSendPhotographerWelcomeEmail.mockResolvedValue({ success: true })

    const { POST } = await import('./route')
    const request = createMockRequest({
      photographerEmail: 'jane@example.com',
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(mockSendPhotographerWelcomeEmail).toHaveBeenCalledWith({
      photographerName: 'Photographer',
      photographerEmail: 'jane@example.com',
      businessName: undefined,
    })
  })

  it('returns 500 when EmailService fails', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'jane@example.com' } },
      error: null,
    })
    mockSendPhotographerWelcomeEmail.mockRejectedValue(new Error('Resend API down'))

    const { POST } = await import('./route')
    const request = createMockRequest({
      photographerName: 'Jane Doe',
      photographerEmail: 'jane@example.com',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to send welcome email')
  })

  it('returns 500 when request body is malformed JSON', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'jane@example.com' } },
      error: null,
    })

    const { POST } = await import('./route')
    const request = createMalformedRequest()

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to send welcome email')
  })
})
