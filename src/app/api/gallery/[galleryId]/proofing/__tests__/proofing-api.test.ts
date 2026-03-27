/**
 * Proofing API Tests — Story 2.1
 *
 * Tests:
 * - POST /api/gallery/[galleryId]/proofing — save proofing selection
 * - POST /api/gallery/[galleryId]/proofing/submit — batch submit
 * - GET /api/gallery/[galleryId]/proofing — retrieve proofing data
 * - Validation: invalid filter, note too long, missing photo_id
 * - Immutability: cannot modify after submission
 * - Auth: unauthorized access rejected
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================================
// MOCK SETUP
// ============================================================================

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fake.supabase.co')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'fake-service-role-key')

const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001'
const MOCK_GALLERY_ID = '00000000-0000-0000-0000-000000000010'
const MOCK_PHOTO_ID = '00000000-0000-0000-0000-000000000100'
const MOCK_SUBMISSION_ID = '00000000-0000-0000-0000-000000001000'

// Track all chained calls for assertions
let chainedCalls: { method: string; args: unknown[] }[] = []

function createChainableMock(resolvedValue: { data: unknown; error: unknown } = { data: null, error: null }) {
  chainedCalls = []
  const chainable: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'upsert', 'eq', 'not', 'is', 'in', 'order', 'limit', 'single', 'maybeSingle']
  for (const method of methods) {
    chainable[method] = vi.fn((...args: unknown[]) => {
      chainedCalls.push({ method, args })
      if (method === 'single' || method === 'maybeSingle') {
        return Promise.resolve(resolvedValue)
      }
      return chainable
    })
  }
  // Make the chain itself thenable for queries without .single()
  chainable.then = vi.fn((resolve: (val: unknown) => unknown) => resolve(resolvedValue))
  return chainable
}

// Separate mock state per "table"
let mockProofingResult: { data: unknown; error: unknown }
let mockGalleryResult: { data: unknown; error: unknown }
let mockProofingListResult: { data: unknown; error: unknown }
let mockUpdateResult: { data: unknown; error: unknown }

const mockSupabaseFrom = vi.fn((table: string) => {
  if (table === 'proofing_submissions') {
    return createChainableMock(mockProofingResult)
  }
  if (table === 'photo_galleries') {
    return createChainableMock(mockGalleryResult)
  }
  return createChainableMock()
})

const mockGetUser = vi.fn()

const mockSupabase = {
  from: mockSupabaseFrom,
  auth: { getUser: mockGetUser },
}

const mockAdminFrom = vi.fn((table: string) => {
  if (table === 'proofing_submissions') {
    return createChainableMock(mockProofingResult)
  }
  if (table === 'photo_galleries') {
    return createChainableMock(mockGalleryResult)
  }
  return createChainableMock()
})

const mockAdminClient = {
  from: mockAdminFrom,
}

vi.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
  createServiceRoleClient: vi.fn(() => mockAdminClient),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Import AFTER mocks
const { GET, POST } = await import('../route')
const { POST: SUBMIT } = await import('../submit/route')

// ============================================================================
// HELPERS
// ============================================================================

function makeRequest(method: string, body?: Record<string, unknown>): NextRequest {
  const url = `http://localhost:3002/api/gallery/${MOCK_GALLERY_ID}/proofing`
  const options: { method: string; body?: string; headers?: Record<string, string> } = { method }
  if (body) {
    options.body = JSON.stringify(body)
    options.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(url, options)
}

const mockParams = Promise.resolve({ galleryId: MOCK_GALLERY_ID })

function authenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: MOCK_USER_ID } },
    error: null,
  })
}

function unauthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  })
}

function galleryWithProofing(overrides: Record<string, unknown> = {}) {
  mockGalleryResult = {
    data: {
      id: MOCK_GALLERY_ID,
      proofing_enabled: true,
      gallery_status: 'proofing',
      payment_timing: 'after_proofing',
      ...overrides,
    },
    error: null,
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Proofing API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProofingResult = { data: null, error: null }
    mockGalleryResult = { data: null, error: null }
    mockProofingListResult = { data: [], error: null }
    mockUpdateResult = { data: null, error: null }
  })

  // ==========================================================================
  // AUTH
  // ==========================================================================

  describe('Authentication', () => {
    it('GET rejects unauthenticated requests', async () => {
      unauthenticatedUser()
      const res = await GET(makeRequest('GET'), { params: mockParams })
      expect(res.status).toBe(401)
    })

    it('POST rejects unauthenticated requests', async () => {
      unauthenticatedUser()
      const res = await POST(
        makeRequest('POST', { photo_id: MOCK_PHOTO_ID }),
        { params: mockParams }
      )
      expect(res.status).toBe(401)
    })

    it('SUBMIT rejects unauthenticated requests', async () => {
      unauthenticatedUser()
      const res = await SUBMIT(makeRequest('POST'), { params: mockParams })
      expect(res.status).toBe(401)
    })
  })

  // ==========================================================================
  // POST — Save proofing selection
  // ==========================================================================

  describe('POST /proofing — save selection', () => {
    it('saves a valid proofing selection', async () => {
      authenticatedUser()
      galleryWithProofing()
      // No existing submitted proofing
      mockProofingResult = {
        data: {
          id: MOCK_SUBMISSION_ID,
          photo_id: MOCK_PHOTO_ID,
          filter_selection: 'grayscale',
          client_note: null,
          updated_at: new Date().toISOString(),
        },
        error: null,
      }

      const res = await POST(
        makeRequest('POST', {
          photo_id: MOCK_PHOTO_ID,
          filter_selection: 'grayscale',
        }),
        { params: mockParams }
      )

      const json = await res.json()
      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('rejects missing photo_id', async () => {
      authenticatedUser()
      const res = await POST(
        makeRequest('POST', { filter_selection: 'grayscale' }),
        { params: mockParams }
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('photo_id')
    })

    it('rejects invalid filter selection', async () => {
      authenticatedUser()
      const res = await POST(
        makeRequest('POST', {
          photo_id: MOCK_PHOTO_ID,
          filter_selection: 'invalid_filter',
        }),
        { params: mockParams }
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('Invalid filter')
    })

    it('rejects notes longer than 500 characters', async () => {
      authenticatedUser()
      const res = await POST(
        makeRequest('POST', {
          photo_id: MOCK_PHOTO_ID,
          client_note: 'x'.repeat(501),
        }),
        { params: mockParams }
      )
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('500')
    })

    it('rejects when proofing is not enabled', async () => {
      authenticatedUser()
      galleryWithProofing({ proofing_enabled: false })

      const res = await POST(
        makeRequest('POST', { photo_id: MOCK_PHOTO_ID }),
        { params: mockParams }
      )
      expect(res.status).toBe(403)
    })

    it('rejects save after proofing already submitted', async () => {
      authenticatedUser()
      galleryWithProofing()
      // Override: admin query returns existing submitted proofing
      mockProofingResult = {
        data: { submitted_at: new Date().toISOString() },
        error: null,
      }

      const res = await POST(
        makeRequest('POST', { photo_id: MOCK_PHOTO_ID }),
        { params: mockParams }
      )
      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toContain('already been submitted')
    })

    it('accepts null filter (approved as-is)', async () => {
      authenticatedUser()
      galleryWithProofing()
      mockProofingResult = {
        data: {
          id: MOCK_SUBMISSION_ID,
          photo_id: MOCK_PHOTO_ID,
          filter_selection: null,
          client_note: 'Looks great!',
          updated_at: new Date().toISOString(),
        },
        error: null,
      }

      const res = await POST(
        makeRequest('POST', {
          photo_id: MOCK_PHOTO_ID,
          filter_selection: null,
          client_note: 'Looks great!',
        }),
        { params: mockParams }
      )

      expect(res.status).toBe(200)
    })
  })

  // ==========================================================================
  // POST /submit — batch submission
  // ==========================================================================

  describe('POST /proofing/submit — batch submit', () => {
    it('submits proofing and transitions gallery status', async () => {
      authenticatedUser()
      galleryWithProofing()
      // No existing submitted proofing
      mockProofingResult = { data: null, error: null }

      // Override admin mock to handle different queries in sequence
      let adminCallCount = 0
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'photo_galleries') {
          return createChainableMock({
            data: {
              id: MOCK_GALLERY_ID,
              proofing_enabled: true,
              gallery_status: 'proofing',
              payment_timing: 'after_proofing',
            },
            error: null,
          })
        }
        if (table === 'proofing_submissions') {
          adminCallCount++
          if (adminCallCount === 1) {
            // First call: check existing submitted (maybeSingle)
            return createChainableMock({ data: null, error: null })
          }
          if (adminCallCount === 2) {
            // Second call: count unsubmitted
            return createChainableMock({
              data: [{ id: '1' }, { id: '2' }],
              error: null,
            })
          }
          // Third call: update submitted_at
          return createChainableMock({ data: null, error: null })
        }
        return createChainableMock()
      })

      const res = await SUBMIT(makeRequest('POST'), { params: mockParams })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.submitted_count).toBe(2)
      expect(json.submitted_at).toBeDefined()
    })

    it('rejects when no proofing selections exist', async () => {
      authenticatedUser()

      let adminCallCount = 0
      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'photo_galleries') {
          return createChainableMock({
            data: {
              id: MOCK_GALLERY_ID,
              proofing_enabled: true,
              gallery_status: 'proofing',
              payment_timing: 'after_proofing',
            },
            error: null,
          })
        }
        if (table === 'proofing_submissions') {
          adminCallCount++
          if (adminCallCount === 1) {
            // Check existing submitted: none
            return createChainableMock({ data: null, error: null })
          }
          // Count unsubmitted: empty
          return createChainableMock({ data: [], error: null })
        }
        return createChainableMock()
      })

      const res = await SUBMIT(makeRequest('POST'), { params: mockParams })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toContain('No proofing selections')
    })

    it('rejects double submission', async () => {
      authenticatedUser()

      mockAdminFrom.mockImplementation((table: string) => {
        if (table === 'photo_galleries') {
          return createChainableMock({
            data: {
              id: MOCK_GALLERY_ID,
              proofing_enabled: true,
              gallery_status: 'proofing_complete',
              payment_timing: 'after_proofing',
            },
            error: null,
          })
        }
        if (table === 'proofing_submissions') {
          // First call: check existing submitted — found one
          return createChainableMock({
            data: { id: MOCK_SUBMISSION_ID },
            error: null,
          })
        }
        return createChainableMock()
      })

      const res = await SUBMIT(makeRequest('POST'), { params: mockParams })
      expect(res.status).toBe(409)
    })
  })

  // ==========================================================================
  // GET — retrieve proofing data
  // ==========================================================================

  describe('GET /proofing — retrieve data', () => {
    it('returns empty array when no proofing exists', async () => {
      authenticatedUser()
      mockProofingResult = { data: [], error: null }

      // Override the chainable to handle the full query chain
      mockSupabaseFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: [], error: null })
        // Override order to return the resolved value
        ;(chain as Record<string, unknown>).order = vi.fn(() => Promise.resolve({ data: [], error: null }))
        return chain
      })

      const res = await GET(makeRequest('GET'), { params: mockParams })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.submissions).toEqual([])
      expect(json.is_submitted).toBe(false)
    })

    it('returns is_submitted=true when proofing has been submitted', async () => {
      authenticatedUser()
      const submissions = [
        {
          id: MOCK_SUBMISSION_ID,
          photo_id: MOCK_PHOTO_ID,
          filter_selection: 'grayscale',
          client_note: 'Make this B&W',
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]

      mockSupabaseFrom.mockImplementation(() => {
        const chain = createChainableMock({ data: submissions, error: null })
        ;(chain as Record<string, unknown>).order = vi.fn(() =>
          Promise.resolve({ data: submissions, error: null })
        )
        return chain
      })

      const res = await GET(makeRequest('GET'), { params: mockParams })
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.is_submitted).toBe(true)
      expect(json.submissions).toHaveLength(1)
      expect(json.submissions[0].filter_selection).toBe('grayscale')
    })
  })
})
