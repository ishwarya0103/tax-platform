import { describe, it, expect } from 'vitest'
import { deriveFormSection, groupFieldsBySection } from './fieldGrouping'
import type { ReturnField } from '../types'

function makeField(overrides: Partial<ReturnField> = {}): ReturnField {
  return {
    id: 'field-test',
    formLine: 'Form 1040, Line 1a',
    label: 'Test field',
    value: '0.00',
    state: 'verified',
    warnings: [],
    editHistory: [],
    ...overrides,
  }
}

describe('deriveFormSection', () => {
  it('strips a trailing "Line N" segment', () => {
    expect(deriveFormSection('Form 1040, Line 1a')).toBe('Form 1040')
    expect(deriveFormSection('Schedule C, Line 22')).toBe('Schedule C')
  })

  it('strips a trailing "Box N" segment', () => {
    expect(deriveFormSection('Schedule K-1 (1120-S), Box 1')).toBe('Schedule K-1 (1120-S)')
  })

  it('keeps multi-comma prefixes intact, dropping only the final Line/Box segment', () => {
    expect(deriveFormSection('Form 1040, Schedule B, Line 1')).toBe('Form 1040, Schedule B')
    expect(deriveFormSection('Schedule K-1 (1065), Partner 2 — R. Alvarez, Box 4')).toBe('Schedule K-1 (1065), Partner 2 — R. Alvarez')
  })

  it('drops trailing parenthetical detail after the Line/Box marker', () => {
    expect(deriveFormSection('Form 1120-S, Line 14 (Form 4562)')).toBe('Form 1120-S')
  })

  it('returns the whole formLine unchanged when there is no trailing Line/Box segment', () => {
    expect(deriveFormSection('Form 1040, Schedule D')).toBe('Form 1040, Schedule D')
    expect(deriveFormSection('IRS e-file signature — Prior year AGI')).toBe('IRS e-file signature — Prior year AGI')
  })
})

describe('groupFieldsBySection', () => {
  it('groups fields under their derived section, preserving first-appearance order', () => {
    const fields = [
      makeField({ id: 'a', formLine: 'Form 1040, Line 1a' }),
      makeField({ id: 'b', formLine: 'Schedule B, Line 1' }),
      makeField({ id: 'c', formLine: 'Form 1040, Line 2a' }),
    ]
    const groups = groupFieldsBySection(fields)
    expect(groups.map((g) => g.section)).toEqual(['Form 1040', 'Schedule B'])
    expect(groups[0].fields.map((f) => f.id)).toEqual(['a', 'c'])
    expect(groups[1].fields.map((f) => f.id)).toEqual(['b'])
  })

  it('returns an empty array for an empty field list', () => {
    expect(groupFieldsBySection([])).toEqual([])
  })
})
