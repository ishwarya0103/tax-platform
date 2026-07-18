import type { ReturnField } from '../types'

// Derives a "section" (form/schedule) grouping key from a field's existing
// formLine, rather than adding a new required field to every ReturnField
// literal in the mock data. A formLine is a comma-separated citation that
// usually ends in the specific line/box ("Form 1065, Line 4", "Schedule K-1
// (1065), Partner 2 — R. Alvarez, Box 1") — stripping that last segment when
// it's a Line/Box reference leaves exactly the shared section every sibling
// field on that same form/schedule/partner/location has in common. Fields
// whose formLine has no such trailing segment (e.g. a one-off signature line)
// are their own section.
export function deriveFormSection(formLine: string): string {
  const parts = formLine.split(', ')
  if (parts.length > 1 && /^(Line|Box)\s/i.test(parts[parts.length - 1])) {
    return parts.slice(0, -1).join(', ')
  }
  return formLine
}

export interface FieldSectionGroup {
  section: string
  fields: ReturnField[]
}

// Groups fields by derived section, preserving first-appearance order (so
// partners/locations/schedules stay in the same order they were authored in
// the data file, rather than being alphabetized).
export function groupFieldsBySection(fields: ReturnField[]): FieldSectionGroup[] {
  const order: string[] = []
  const bySection = new Map<string, ReturnField[]>()
  for (const field of fields) {
    const section = deriveFormSection(field.formLine)
    if (!bySection.has(section)) {
      bySection.set(section, [])
      order.push(section)
    }
    bySection.get(section)!.push(field)
  }
  return order.map((section) => ({ section, fields: bySection.get(section)! }))
}
