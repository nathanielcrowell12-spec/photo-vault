import { describe, it, expect } from 'vitest'
import { filterDroppedImages } from './accept-files'

const file = (name: string, type: string) => new File(['x'], name, { type })

describe('filterDroppedImages', () => {
  it('returns empty for null', () => {
    expect(filterDroppedImages(null)).toEqual([])
  })

  it('returns empty for empty list', () => {
    expect(filterDroppedImages([])).toEqual([])
  })

  it('filters out non-images', () => {
    const result = filterDroppedImages([
      file('a.pdf', 'application/pdf'),
      file('b.jpg', 'image/jpeg'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('b.jpg')
  })

  it('keeps all image/* types', () => {
    const result = filterDroppedImages([
      file('a.jpg', 'image/jpeg'),
      file('b.png', 'image/png'),
      file('c.gif', 'image/gif'),
      file('d.webp', 'image/webp'),
    ])
    expect(result).toHaveLength(4)
  })

  it('returns empty when all non-image', () => {
    const result = filterDroppedImages([file('a.txt', 'text/plain')])
    expect(result).toEqual([])
  })
})
