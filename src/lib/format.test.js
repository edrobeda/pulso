import { describe, expect, it } from 'vitest'
import { dayLabel, postDateTimeLabel, commentDateLabel } from './format'

describe('dayLabel', () => {
  it('formata data ISO em português, maiúsculo, sem ponto de abreviação', () => {
    const label = dayLabel('2026-09-13')
    expect(label).not.toContain('.')
    expect(label).toBe(label.toUpperCase())
    expect(label).toContain('2026')
  })
})

describe('postDateTimeLabel', () => {
  it('combina dayLabel com o slot do post', () => {
    const label = postDateTimeLabel({ date: '2026-09-13', slot: '08:00' })
    expect(label).toContain('08:00')
    expect(label).toContain(dayLabel('2026-09-13'))
  })
})

describe('commentDateLabel', () => {
  it('formata timestamp sem lançar erro e sem ponto de abreviação', () => {
    const label = commentDateLabel('2026-09-13T12:00:00Z')
    expect(label).not.toContain('.')
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })
})
