/**
 * Assign Photographer API Route Tests
 *
 * Tests for PATCH /api/admin/galleries/[galleryId]/assign-photographer
 *
 * Test Coverage:
 * - Admin authorization
 * - Photographer assignment
 * - Photographer unassignment (null)
 * - Onboarding email for inactive photographers
 * - Error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// ============================================================================
// MOCK SETUP - Must be before any imports that use these modules
// ============================================================================

vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://photovault.photo')

// Create mock functions
const mockFromResult = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
}

const mockSupabaseFrom = vi.fn().mockReturnValue(mockFromResult)

const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  admin: {
    listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
  },
}

const mockSupabase = {
  from: mockSupabaseFrom,
  auth: mockSupabaseAuth,
}

vi.mock('@/lib/supabase', () => ({
  createServerSupabaseClient: () => mockSupabase,
}))

// Must use vi.hoisted() for mock functions used inside vi.mock factory
const { mockSendPhotographerGalleryAssignmentEmail } = vi.hoisted(() => ({
  mockSendPhotographerGalleryAssignmentEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock EmailService with static method
vi.mock('@/lib/email/email-service', () => ({
  EmailService: {
    sendPhotographerGalleryAssignmentEmail: mockSendPhotographerGalleryAssignmentEmail,
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

function createMockParams(galleryId: string): { params: Promise<{ galleryId: string }> } {
  return {
    params: Promise.resolve({ galleryId }),
  }
}

// ============================================================================
// IMPORT HANDLER AFTER MOCKS
// ============================================================================

import { PATCH } from './route'

// ============================================================================
// TEST SUITES
// ============================================================================

describe('PATCH /api/admin/galleries/[galleryId]/assign-photographer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authorization', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error).toBe('Unauthorized')
    })

    it('should return 403 if user is not admin', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user_123' } },
        error: null,
      })

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'photographer' }, // Not admin
              error: null,
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error).toBe('Admin access required')
    })
  })

  describe('Gallery Not Found', () => {
    it('should return 404 if gallery does not exist', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'admin' },
              error: null,
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('nonexistent_gallery'))
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('Gallery not found')
    })
  })

  describe('Photographer Assignment', () => {
    it('should assign photographer to gallery successfully', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      mockSupabaseAuth.admin.listUsers.mockResolvedValue({
        data: {
          users: [{ id: 'photo_123', email: 'photographer@example.com' }],
        },
        error: null,
      })

      let updatedData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              // First call for admin check, second for photographer lookup
              return Promise.resolve({
                data: { user_type: 'admin', full_name: 'Test Photographer', payment_status: 'active' },
                error: null,
              })
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gallery_123',
                name: 'Test Gallery',
                photographer_id: null,
                photographer_name: null,
              },
              error: null,
            }),
            update: vi.fn().mockImplementation((data) => {
              updatedData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.gallery.photographer_id).toBe('photo_123')
      expect(updatedData.photographer_id).toBe('photo_123')
    })

    it('should send onboarding email when photographer is inactive', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      mockSupabaseAuth.admin.listUsers.mockResolvedValue({
        data: {
          users: [{ id: 'photo_123', email: 'photographer@example.com' }],
        },
        error: null,
      })

      let photographerLookupCount = 0

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              photographerLookupCount++
              if (photographerLookupCount === 1) {
                // Admin check
                return Promise.resolve({
                  data: { user_type: 'admin' },
                  error: null,
                })
              }
              // Photographer lookup - INACTIVE
              return Promise.resolve({
                data: {
                  id: 'photo_123',
                  full_name: 'Test Photographer',
                  payment_status: 'not_started', // Inactive!
                },
                error: null,
              })
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gallery_123',
                name: 'Wedding Photos 2026',
                photographer_id: null, // Not previously assigned
                photographer_name: null,
              },
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.email_sent).toBe(true)
      expect(mockSendPhotographerGalleryAssignmentEmail).toHaveBeenCalledWith({
        to: 'photographer@example.com',
        photographerName: 'Test Photographer',
        galleryName: 'Wedding Photos 2026',
        onboardingUrl: 'https://photovault.photo/photographer/onboarding',
      })
    })

    it('should NOT send email when photographer is already active', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      let photographerLookupCount = 0

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              photographerLookupCount++
              if (photographerLookupCount === 1) {
                return Promise.resolve({
                  data: { user_type: 'admin' },
                  error: null,
                })
              }
              return Promise.resolve({
                data: {
                  id: 'photo_123',
                  full_name: 'Test Photographer',
                  payment_status: 'active', // Already active!
                },
                error: null,
              })
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gallery_123',
                name: 'Test Gallery',
                photographer_id: null,
                photographer_name: null,
              },
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.email_sent).toBe(false)
      expect(mockSendPhotographerGalleryAssignmentEmail).not.toHaveBeenCalled()
    })

    it('should NOT send email when re-assigning same photographer', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      let photographerLookupCount = 0

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              photographerLookupCount++
              if (photographerLookupCount === 1) {
                return Promise.resolve({
                  data: { user_type: 'admin' },
                  error: null,
                })
              }
              return Promise.resolve({
                data: {
                  id: 'photo_123',
                  full_name: 'Test Photographer',
                  payment_status: 'not_started', // Inactive, but already assigned
                },
                error: null,
              })
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gallery_123',
                name: 'Test Gallery',
                photographer_id: 'photo_123', // ALREADY assigned to this photographer
                photographer_name: 'Test Photographer',
              },
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'photo_123' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.email_sent).toBe(false)
      expect(mockSendPhotographerGalleryAssignmentEmail).not.toHaveBeenCalled()
    })
  })

  describe('Photographer Unassignment', () => {
    it('should unassign photographer when photographer_id is null', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      let updatedData: Record<string, unknown> = {}

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { user_type: 'admin' },
              error: null,
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gallery_123',
                name: 'Test Gallery',
                photographer_id: 'photo_123',
                photographer_name: 'Previous Photographer',
              },
              error: null,
            }),
            update: vi.fn().mockImplementation((data) => {
              updatedData = data
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              }
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: null })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.gallery.photographer_id).toBeNull()
      expect(json.message).toBe('Photographer unassigned from gallery.')
      // Should preserve photographer_name for historical display
      expect(json.gallery.photographer_name).toBe('Previous Photographer')
      expect(updatedData.photographer_id).toBeNull()
    })
  })

  describe('Photographer Not Found', () => {
    it('should return 404 if photographer does not exist', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'admin_123' } },
        error: null,
      })

      let photographerLookupCount = 0

      mockSupabaseFrom.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockImplementation(() => {
              photographerLookupCount++
              if (photographerLookupCount === 1) {
                return Promise.resolve({
                  data: { user_type: 'admin' },
                  error: null,
                })
              }
              // Photographer not found
              return Promise.resolve({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              })
            }),
          }
        }
        if (table === 'photo_galleries') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'gallery_123',
                name: 'Test Gallery',
                photographer_id: null,
                photographer_name: null,
              },
              error: null,
            }),
          }
        }
        return mockFromResult
      })

      const request = createMockRequest({ photographer_id: 'nonexistent_photo' })
      const response = await PATCH(request, createMockParams('gallery_123'))
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error).toBe('Photographer not found')
    })
  })
})
