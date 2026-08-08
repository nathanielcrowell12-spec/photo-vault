import { describe, it, expect } from 'vitest'
import { buildLocationTitle, TITLE_MAX } from '@/lib/directory-seo'

// The 2026-08-07 on-page crawl found 40 titles over 65 characters, nearly all from
// the directory location template:
//   "{Location} - Photography Location in {City} | PhotoVault Directory"  (66-110 chars)
// Google truncates around 60.

describe('buildLocationTitle', () => {
  it('keeps a typical location under the truncation limit', () => {
    const title = buildLocationTitle({
      name: 'Olbrich Botanical Gardens',
      city: 'Madison',
      state: 'WI',
    })
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
    expect(title).toBe('Olbrich Botanical Gardens Photos — Madison, WI | PhotoVault')
  })

  it('keeps the worst offender from the crawl under the limit', () => {
    // /directory/madison/hilldale-shopping-center was 110 chars.
    const title = buildLocationTitle({
      name: 'Hilldale Shopping Center',
      city: 'Madison',
      state: 'WI',
    })
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it('drops the state first when the full template overflows', () => {
    // 'Alliant Energy Center Grounds Photos — Madison, WI | PhotoVault' is 62.
    const title = buildLocationTitle({
      name: 'Alliant Energy Center Grounds',
      city: 'Madison',
      state: 'WI',
    })
    expect(title).toBe('Alliant Energy Center Grounds Photos — Madison | PhotoVault')
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it('keeps the word "Photos" longer than the city — it is the actual query term', () => {
    // 33 chars: too long for the city variant (63), fits the Photos variant (53).
    const title = buildLocationTitle({
      name: 'Capitol Square / State Street Loop',
      city: 'Madison',
      state: 'WI',
    })
    expect(title).toBe('Capitol Square / State Street Loop Photos | PhotoVault')
    expect(title).toContain('Photos')
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it('falls back to the bare name when nothing else fits', () => {
    const title = buildLocationTitle({
      name: 'The Extremely Long Named Memorial Conservatory And Sculpture Garden',
      city: 'Madison',
      state: 'WI',
    })
    // Cannot go under the limit without mangling a proper noun. Emit the floor
    // rather than the old 100+ char template.
    expect(title).toBe(
      'The Extremely Long Named Memorial Conservatory And Sculpture Garden | PhotoVault'
    )
    expect(title).not.toContain('Photography Location in')
  })

  it('omits the state when the record has none', () => {
    const title = buildLocationTitle({ name: 'Memorial Union Terrace', city: 'Madison' })
    expect(title).toBe('Memorial Union Terrace Photos — Madison | PhotoVault')
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX)
  })

  it('never emits the old over-length template', () => {
    const title = buildLocationTitle({ name: 'Olin Park', city: 'Madison', state: 'WI' })
    expect(title).not.toContain('PhotoVault Directory')
  })
})
