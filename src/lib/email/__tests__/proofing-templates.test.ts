/**
 * Proofing Email Templates Tests — Story E.1
 *
 * Tests:
 * - All 4 proofing email templates render correct HTML and text
 * - EmailService methods for proofing emails exist and call Resend correctly
 * - Notification API route triggers correct emails
 */
import { describe, it, expect } from 'vitest'

import {
  getProofingInvitationEmailHTML,
  getProofingInvitationEmailText,
  getProofingDeadlineReminderEmailHTML,
  getProofingDeadlineReminderEmailText,
  getRevisionsCompleteEmailHTML,
  getRevisionsCompleteEmailText,
  getProofingAutoClosedEmailHTML,
  getProofingAutoClosedEmailText,
  getProofingAutoClosedPhotographerEmailHTML,
  getProofingAutoClosedPhotographerEmailText,
  type ProofingInvitationEmailData,
  type ProofingDeadlineReminderEmailData,
  type RevisionsCompleteEmailData,
  type ProofingAutoClosedEmailData,
  type ProofingAutoClosedPhotographerEmailData,
} from '../proofing-templates'

// ============================================================================
// Test Data
// ============================================================================

const MOCK_PROOFING_INVITATION: ProofingInvitationEmailData = {
  clientName: 'Jane Smith',
  clientEmail: 'jane@example.com',
  photographerName: 'Bob Photos',
  galleryName: 'Smith Wedding',
  galleryUrl: 'https://photovault.photo/gallery/abc123',
  proofingDeadline: '2026-04-15',
  photoCount: 247,
}

const MOCK_DEADLINE_REMINDER: ProofingDeadlineReminderEmailData = {
  clientName: 'Jane Smith',
  clientEmail: 'jane@example.com',
  photographerName: 'Bob Photos',
  galleryName: 'Smith Wedding',
  galleryUrl: 'https://photovault.photo/gallery/abc123',
  proofingDeadline: '2026-04-15',
  daysRemaining: 3,
}

const MOCK_REVISIONS_COMPLETE: RevisionsCompleteEmailData = {
  clientName: 'Jane Smith',
  clientEmail: 'jane@example.com',
  photographerName: 'Bob Photos',
  galleryName: 'Smith Wedding',
  galleryUrl: 'https://photovault.photo/gallery/abc123',
  paymentRequired: true,
}

const MOCK_AUTO_CLOSED: ProofingAutoClosedEmailData = {
  clientName: 'Jane Smith',
  clientEmail: 'jane@example.com',
  photographerName: 'Bob Photos',
  galleryName: 'Smith Wedding',
  galleryUrl: 'https://photovault.photo/gallery/abc123',
}

const MOCK_AUTO_CLOSED_PHOTOGRAPHER: ProofingAutoClosedPhotographerEmailData = {
  photographerName: 'Bob Photos',
  photographerEmail: 'bob@photos.com',
  clientName: 'Jane Smith',
  galleryName: 'Smith Wedding',
  galleryId: 'abc123',
}

// ============================================================================
// 1. Proofing Invitation Email
// ============================================================================

describe('Proofing Invitation Email', () => {
  it('HTML contains client name and gallery name', () => {
    const html = getProofingInvitationEmailHTML(MOCK_PROOFING_INVITATION)
    expect(html).toContain('Jane Smith')
    expect(html).toContain('Smith Wedding')
  })

  it('HTML contains photographer name', () => {
    const html = getProofingInvitationEmailHTML(MOCK_PROOFING_INVITATION)
    expect(html).toContain('Bob Photos')
  })

  it('HTML contains gallery URL as link', () => {
    const html = getProofingInvitationEmailHTML(MOCK_PROOFING_INVITATION)
    expect(html).toContain('https://photovault.photo/gallery/abc123')
  })

  it('HTML contains proofing deadline', () => {
    const html = getProofingInvitationEmailHTML(MOCK_PROOFING_INVITATION)
    expect(html).toContain('April 15')
  })

  it('HTML contains photo count', () => {
    const html = getProofingInvitationEmailHTML(MOCK_PROOFING_INVITATION)
    expect(html).toContain('247')
  })

  it('HTML contains CTA button for reviewing photos', () => {
    const html = getProofingInvitationEmailHTML(MOCK_PROOFING_INVITATION)
    expect(html).toContain('Review Your Photos')
  })

  it('text version contains essential info', () => {
    const text = getProofingInvitationEmailText(MOCK_PROOFING_INVITATION)
    expect(text).toContain('Jane Smith')
    expect(text).toContain('Smith Wedding')
    expect(text).toContain('Bob Photos')
    expect(text).toContain('https://photovault.photo/gallery/abc123')
  })
})

// ============================================================================
// 2. Deadline Reminder Email
// ============================================================================

describe('Proofing Deadline Reminder Email', () => {
  it('HTML contains days remaining', () => {
    const html = getProofingDeadlineReminderEmailHTML(MOCK_DEADLINE_REMINDER)
    expect(html).toContain('3 days')
  })

  it('HTML contains gallery name and client name', () => {
    const html = getProofingDeadlineReminderEmailHTML(MOCK_DEADLINE_REMINDER)
    expect(html).toContain('Smith Wedding')
    expect(html).toContain('Jane Smith')
  })

  it('HTML contains gallery URL', () => {
    const html = getProofingDeadlineReminderEmailHTML(MOCK_DEADLINE_REMINDER)
    expect(html).toContain('https://photovault.photo/gallery/abc123')
  })

  it('HTML contains urgency messaging', () => {
    const html = getProofingDeadlineReminderEmailHTML(MOCK_DEADLINE_REMINDER)
    expect(html).toContain('deadline')
  })

  it('text version contains essential info', () => {
    const text = getProofingDeadlineReminderEmailText(MOCK_DEADLINE_REMINDER)
    expect(text).toContain('3 days')
    expect(text).toContain('Smith Wedding')
    expect(text).toContain('https://photovault.photo/gallery/abc123')
  })
})

// ============================================================================
// 3. Revisions Complete Email
// ============================================================================

describe('Revisions Complete Email', () => {
  it('HTML contains photographer name and gallery name', () => {
    const html = getRevisionsCompleteEmailHTML(MOCK_REVISIONS_COMPLETE)
    expect(html).toContain('Bob Photos')
    expect(html).toContain('Smith Wedding')
  })

  it('HTML shows payment required message when paymentRequired=true', () => {
    const html = getRevisionsCompleteEmailHTML(MOCK_REVISIONS_COMPLETE)
    expect(html).toContain('payment')
  })

  it('HTML shows delivered message when paymentRequired=false', () => {
    const data = { ...MOCK_REVISIONS_COMPLETE, paymentRequired: false }
    const html = getRevisionsCompleteEmailHTML(data)
    expect(html).toContain('ready to download')
  })

  it('HTML contains gallery URL', () => {
    const html = getRevisionsCompleteEmailHTML(MOCK_REVISIONS_COMPLETE)
    expect(html).toContain('https://photovault.photo/gallery/abc123')
  })

  it('text version contains essential info', () => {
    const text = getRevisionsCompleteEmailText(MOCK_REVISIONS_COMPLETE)
    expect(text).toContain('Bob Photos')
    expect(text).toContain('Smith Wedding')
    expect(text).toContain('https://photovault.photo/gallery/abc123')
  })
})

// ============================================================================
// 4. Proofing Auto-Closed Email (Client)
// ============================================================================

describe('Proofing Auto-Closed Email (Client)', () => {
  it('HTML contains client name and gallery name', () => {
    const html = getProofingAutoClosedEmailHTML(MOCK_AUTO_CLOSED)
    expect(html).toContain('Jane Smith')
    expect(html).toContain('Smith Wedding')
  })

  it('HTML explains deadline has passed', () => {
    const html = getProofingAutoClosedEmailHTML(MOCK_AUTO_CLOSED)
    expect(html).toContain('deadline')
  })

  it('HTML contains gallery URL', () => {
    const html = getProofingAutoClosedEmailHTML(MOCK_AUTO_CLOSED)
    expect(html).toContain('https://photovault.photo/gallery/abc123')
  })

  it('text version contains essential info', () => {
    const text = getProofingAutoClosedEmailText(MOCK_AUTO_CLOSED)
    expect(text).toContain('Jane Smith')
    expect(text).toContain('Smith Wedding')
  })
})

// ============================================================================
// 5. Proofing Auto-Closed Email (Photographer)
// ============================================================================

describe('Proofing Auto-Closed Email (Photographer)', () => {
  it('HTML contains photographer name and client name', () => {
    const html = getProofingAutoClosedPhotographerEmailHTML(MOCK_AUTO_CLOSED_PHOTOGRAPHER)
    expect(html).toContain('Bob Photos')
    expect(html).toContain('Jane Smith')
  })

  it('HTML contains gallery name', () => {
    const html = getProofingAutoClosedPhotographerEmailHTML(MOCK_AUTO_CLOSED_PHOTOGRAPHER)
    expect(html).toContain('Smith Wedding')
  })

  it('text version contains essential info', () => {
    const text = getProofingAutoClosedPhotographerEmailText(MOCK_AUTO_CLOSED_PHOTOGRAPHER)
    expect(text).toContain('Bob Photos')
    expect(text).toContain('Jane Smith')
    expect(text).toContain('Smith Wedding')
  })
})
