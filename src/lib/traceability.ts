import type { ReturnField } from '../types'

// Strips exactly the formatting differences the user's instructions call out —
// currency signs, thousands separators, all whitespace, and case — nothing more.
// This is intentionally the entire "fuzziness": no edit-distance, no token
// matching. It has to stay simple enough to explain in one sentence.
function normalizeForMatch(text: string): string {
  return text.toLowerCase().replace(/\$/g, '').replace(/,/g, '').replace(/\s+/g, '')
}

// Deterministic, non-AI check: does the field's claimed value literally appear
// in the text of the source snippet it's supposedly extracted from? Plain
// substring containment after normalizing away formatting — not exact
// equality, but not fuzzy in any statistical sense either.
export function valueAppearsInSnippet(value: string, snippet: string): boolean {
  const normalizedValue = normalizeForMatch(value)
  if (!normalizedValue) return false
  return normalizeForMatch(snippet).includes(normalizedValue)
}

// Convenience wrapper for a whole field. `null` = not applicable (no source to
// check against) — distinct from `false`, which means there IS a source and
// the value could not be confirmed in it.
export function checkFieldTraceability(field: ReturnField): boolean | null {
  if (!field.source) return null
  return valueAppearsInSnippet(field.value, field.source.snippet)
}
