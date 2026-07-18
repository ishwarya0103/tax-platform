import { describe, it, expect } from 'vitest'
import { valueAppearsInSnippet, checkFieldTraceability } from './traceability'
import { returns } from '../data'
import type { ReturnField } from '../types'

function findField(returnId: string, fieldId: string): ReturnField {
  const ret = returns.find((r) => r.id === returnId)
  const field = ret?.fields.find((f) => f.id === fieldId)
  if (!field) throw new Error(`Fixture field not found: ${returnId}/${fieldId}`)
  return field
}

describe('valueAppearsInSnippet — normal pass cases', () => {
  it('matches a value that appears verbatim in the snippet', () => {
    expect(valueAppearsInSnippet('86,412.00', 'Box 1 — Wages, tips, other compensation: 86,412.00')).toBe(true)
  })

  it('matches regardless of where in the snippet the value sits', () => {
    expect(valueAppearsInSnippet('184.00', 'Box 7 — Foreign tax paid: 184.00')).toBe(true)
  })

  it('does not match when the value is genuinely absent from the snippet', () => {
    expect(valueAppearsInSnippet('999.99', 'Box 1 — Wages, tips, other compensation: 86,412.00')).toBe(false)
  })
})

describe('valueAppearsInSnippet — normalization', () => {
  it('ignores a leading currency symbol on either side', () => {
    expect(valueAppearsInSnippet('$1,340.00', 'Box 1 — Interest income: 1,340.00')).toBe(true)
    expect(valueAppearsInSnippet('1,340.00', 'Box 1 — Interest income: $1,340.00')).toBe(true)
  })

  it('ignores thousands-separator commas on either side', () => {
    expect(valueAppearsInSnippet('1340.00', 'Total: 1,340.00')).toBe(true)
    expect(valueAppearsInSnippet('1,340.00', 'Total: 1340.00')).toBe(true)
  })

  it('ignores whitespace differences entirely, not just collapsing runs', () => {
    expect(valueAppearsInSnippet('1,340.00', 'Total :   1,340.00 ')).toBe(true)
    expect(valueAppearsInSnippet(' 1, 340.00 ', 'Total: 1,340.00')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(valueAppearsInSnippet('PAID', 'Status: paid in full')).toBe(true)
    expect(valueAppearsInSnippet('paid', 'Status: PAID IN FULL')).toBe(true)
  })

  it('treats an empty (or whitespace-only) value as never matching', () => {
    expect(valueAppearsInSnippet('', 'Total: 1,340.00')).toBe(false)
    expect(valueAppearsInSnippet('   ', '')).toBe(false)
  })
})

describe('checkFieldTraceability — wrapper semantics', () => {
  it('returns null when the field has no source to check against', () => {
    const field: ReturnField = {
      id: 'f1',
      formLine: 'Form 1040, Line 26',
      label: 'Estimated payments',
      value: '3,600.00',
      state: 'client-provided',
      warnings: [],
      editHistory: [],
    }
    expect(checkFieldTraceability(field)).toBeNull()
  })

  it('returns true when the sourced field is a clean match', () => {
    const field: ReturnField = {
      id: 'f2',
      formLine: 'Form 1040, Line 1a',
      label: 'Wages',
      value: '86,412.00',
      state: 'ai-extracted',
      source: { documentId: 'doc-1', page: 1, snippet: 'Box 1 — Wages: 86,412.00' },
      warnings: [],
      editHistory: [],
    }
    expect(checkFieldTraceability(field)).toBe(true)
  })

  it('returns false when the sourced field does not match', () => {
    const field: ReturnField = {
      id: 'f3',
      formLine: 'Form 1040, Line 1a',
      label: 'Wages',
      value: '99,999.00',
      state: 'ai-extracted',
      source: { documentId: 'doc-1', page: 1, snippet: 'Box 1 — Wages: 86,412.00' },
      warnings: [],
      editHistory: [],
    }
    expect(checkFieldTraceability(field)).toBe(false)
  })
})

describe('checkFieldTraceability — the three known "could not confirm" cases in the mock data', () => {
  it("Dana Ruiz's mileage deduction: an AI ESTIMATE from a damaged photo, so it was never going to appear verbatim", () => {
    // value is "612 mi" but the snippet only contains fragments ("12 mi", "9 mi") from a
    // partially illegible log — this field's whole design intent (see aiConfidence: 0.38 and
    // its warnings) is that the AI is honestly guessing at a total it can't fully read, not
    // transcribing a number that's actually printed anywhere in the source. This is a correct,
    // expected "false", not a bug in the matcher.
    const field = findField('ret-dana-ruiz-2025', 'field-dana-mileage-deduction')
    expect(field.value).toBe('612 mi')
    expect(field.source?.snippet).toContain('12 mi')
    expect(checkFieldTraceability(field)).toBe(false)
  })

  it("Marcus Webb's capital gains: a COMPUTED figure never literally quoted in its source", () => {
    // value (6,214.00) is proceeds minus cost basis; the snippet only shows the two raw
    // inputs (41,880.00 and 35,666.00), never their difference. No amount of normalization
    // makes this matchable — it's a structural limitation of substring matching (it can't do
    // arithmetic), not a bug.
    const field = findField('ret-marcus-webb-2025', 'field-marcus-capital-gains')
    expect(field.value).toBe('6,214.00')
    expect(field.source?.snippet).toContain('41,880.00')
    expect(field.source?.snippet).toContain('35,666.00')
    expect(checkFieldTraceability(field)).toBe(false)
  })

  it("Dana Ruiz's supplies expense: the deliberately injected transposed-digit mismatch", () => {
    // value is 621.47 but the source snippet says 612.47 — a realistic data-entry slip,
    // injected on purpose so this check has something real to catch. state is 'verified' and
    // aiConfidence is 0.88 (high) on purpose too: this is the case that proves the check
    // catches something even past a confident AI extraction AND a preparer's own sign-off.
    const field = findField('ret-dana-ruiz-2025', 'field-dana-supplies-expense')
    expect(field.value).toBe('621.47')
    expect(field.source?.snippet).toBe('Total: 612.47')
    expect(field.state).toBe('verified')
    expect(field.aiConfidence).toBe(0.88)
    expect(checkFieldTraceability(field)).toBe(false)
  })
})

describe('checkFieldTraceability — known "verified" cases in the mock data, for contrast', () => {
  it('confirms a clean, high-confidence extraction (Sarah Chen wages)', () => {
    const field = findField('ret-sarah-chen-2025', 'field-sarah-wages')
    expect(checkFieldTraceability(field)).toBe(true)
  })

  it('confirms a locked, post-filing field (Ridgeline Landscaping officer compensation)', () => {
    const field = findField('ret-ridgeline-landscaping-2025', 'field-ridgeline-officer-comp')
    expect(checkFieldTraceability(field)).toBe(true)
  })
})
