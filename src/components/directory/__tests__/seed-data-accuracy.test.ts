/**
 * Seed data accuracy tests
 * These verify that the seed script contains correct, verified data.
 * Run BEFORE deploying seed data to production.
 */
import { describe, it, expect } from 'vitest'
import path from 'path'

// We'll dynamically import the seed data to test it
// The seed script exports locationsData for testing
async function loadSeedData() {
  // Import the seed data module
  const mod = await import('../../../../scripts/seed-madison-locations-data')
  return mod.locationsData
}

describe('Seed data accuracy', () => {
  let locationsData: any[]

  beforeAll(async () => {
    locationsData = await loadSeedData()
  })

  function findLocation(slug: string) {
    const entry = locationsData.find((d: any) => d.location.slug === slug)
    if (!entry) throw new Error(`Location "${slug}" not found in seed data`)
    return entry
  }

  describe('UW-Madison Arboretum', () => {
    it('permit_status should be "Yes" (permit required)', () => {
      const { intelligence } = findLocation('uw-madison-arboretum')
      expect(intelligence.permit_status).toBe('Yes')
    })

    it('permit_cost should contain "$35"', () => {
      const { intelligence } = findLocation('uw-madison-arboretum')
      expect(intelligence.permit_cost).toContain('$35')
    })
  })

  describe('Olbrich Botanical Gardens', () => {
    it('permit_status should be "Yes" (permit required)', () => {
      const { intelligence } = findLocation('olbrich-botanical-gardens')
      expect(intelligence.permit_status).toBe('Yes')
    })

    it('permit_cost should contain "$125"', () => {
      const { intelligence } = findLocation('olbrich-botanical-gardens')
      expect(intelligence.permit_cost).toContain('$125')
    })

    it('insider_tips should NOT contain "$2"', () => {
      const { intelligence } = findLocation('olbrich-botanical-gardens')
      expect(intelligence.insider_tips).not.toContain('$2')
    })
  })

  describe('Pope Farm Conservancy', () => {
    it('description should NOT contain "sunflower"', () => {
      const { location } = findLocation('pope-farm-conservancy')
      expect(location.description.toLowerCase()).not.toContain('sunflower')
    })

    it('seasonal_availability should NOT contain "sunflower"', () => {
      const { intelligence } = findLocation('pope-farm-conservancy')
      expect(intelligence.seasonal_availability.toLowerCase()).not.toContain('sunflower')
    })
  })

  describe('Picnic Point', () => {
    it('insider_tips should contain "Lot 130"', () => {
      const { intelligence } = findLocation('picnic-point')
      expect(intelligence.insider_tips).toContain('Lot 130')
    })
  })
})
