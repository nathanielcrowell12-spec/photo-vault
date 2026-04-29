import { describe, it, expect } from 'vitest'
import { detectOSFromHints } from './detect-os'

describe('detectOSFromHints', () => {
  it('uses platform hint: Windows', () => {
    expect(detectOSFromHints('Windows', 'irrelevant')).toBe('windows')
  })

  it('uses platform hint: macOS', () => {
    expect(detectOSFromHints('macOS', 'irrelevant')).toBe('mac')
  })

  it('uses platform hint: Linux', () => {
    expect(detectOSFromHints('Linux', 'irrelevant')).toBe('linux')
  })

  it('falls back to UA: Windows Chrome', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0'
    expect(detectOSFromHints(undefined, ua)).toBe('windows')
  })

  it('falls back to UA: macOS Safari', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
    expect(detectOSFromHints(undefined, ua)).toBe('mac')
  })

  it('falls back to UA: Ubuntu Firefox', () => {
    const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0'
    expect(detectOSFromHints(undefined, ua)).toBe('linux')
  })

  it('falls back to UA: iOS Safari returns mac (best-effort, iOS not a desktop target)', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    expect(detectOSFromHints(undefined, ua)).toBe('mac')
  })

  it('returns unknown for empty inputs', () => {
    expect(detectOSFromHints(undefined, undefined)).toBe('unknown')
    expect(detectOSFromHints('', '')).toBe('unknown')
  })
})
