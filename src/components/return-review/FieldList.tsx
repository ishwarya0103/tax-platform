import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { FieldStateBadge } from '../../design-system'
import { deriveFormSection } from '../../lib/fieldGrouping'
import type { FieldState, ReturnField } from '../../types'

interface FieldListProps {
  fields: ReturnField[]
  selectedFieldId: string | null
  onSelect: (fieldId: string) => void
}

const STATE_FILTER_OPTIONS: { value: FieldState | 'all'; label: string }[] = [
  { value: 'all', label: 'All states' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'ai-extracted', label: 'AI-extracted' },
  { value: 'verified', label: 'Verified' },
  { value: 'client-provided', label: 'Client-provided' },
  { value: 'locked', label: 'Locked' },
]

function matchesQuery(field: ReturnField, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    field.label.toLowerCase().includes(q) ||
    field.formLine.toLowerCase().includes(q) ||
    field.value.toLowerCase().includes(q)
  )
}

interface Section {
  name: string
  fields: ReturnField[]
  needsReviewCount: number
}

// Groups fields by their derived form/schedule section, in first-appearance
// order — this is a small, list-specific reshaping (filter → group → count),
// not reusable business logic, so it lives here rather than in lib/.
function buildSections(fields: ReturnField[]): Section[] {
  const order: string[] = []
  const bySection = new Map<string, ReturnField[]>()
  for (const field of fields) {
    const name = deriveFormSection(field.formLine)
    if (!bySection.has(name)) {
      order.push(name)
      bySection.set(name, [])
    }
    bySection.get(name)!.push(field)
  }
  return order.map((name) => {
    const sectionFields = bySection.get(name)!
    return { name, fields: sectionFields, needsReviewCount: sectionFields.filter((f) => f.state === 'needs-review').length }
  })
}

export function FieldList({ fields, selectedFieldId, onSelect }: FieldListProps) {
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<FieldState | 'all'>('all')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const selected = fields.find((f) => f.id === selectedFieldId)
    return new Set(selected ? [deriveFormSection(selected.formLine)] : [])
  })

  // Whenever the selected field changes from outside this list (a deep link
  // from a thread, "Dashboard" restoring a previous field, etc.), make sure
  // its section is visibly expanded rather than leaving the selection
  // scrolled into a collapsed, invisible section.
  useEffect(() => {
    const selected = fields.find((f) => f.id === selectedFieldId)
    if (!selected) return
    const section = deriveFormSection(selected.formLine)
    setExpandedSections((prev) => (prev.has(section) ? prev : new Set(prev).add(section)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFieldId])

  const isFiltering = query.trim().length > 0 || stateFilter !== 'all'

  const filteredFields = useMemo(
    () => fields.filter((f) => (stateFilter === 'all' || f.state === stateFilter) && matchesQuery(f, query)),
    [fields, stateFilter, query],
  )

  const allSections = useMemo(() => buildSections(fields), [fields])
  const visibleSections = useMemo(() => {
    if (!isFiltering) return allSections
    // While filtering, only show sections with at least one match, and only
    // the matching fields within them — searching hundreds of fields should
    // narrow the whole outline, not just highlight rows inside it.
    const matchedIds = new Set(filteredFields.map((f) => f.id))
    return allSections
      .map((s) => ({ ...s, fields: s.fields.filter((f) => matchedIds.has(f.id)) }))
      .filter((s) => s.fields.length > 0)
  }, [allSections, isFiltering, filteredFields])

  function toggleSection(name: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <nav className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <div className="shrink-0 space-y-2 border-b border-slate-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields…"
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-sm text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value as FieldState | 'all')}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600"
          >
            {STATE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="shrink-0 text-xs text-slate-400">
            {filteredFields.length} of {fields.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleSections.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">No fields match.</p>
        ) : (
          visibleSections.map((section) => {
            const expanded = isFiltering || expandedSections.has(section.name)
            return (
              <div key={section.name} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleSection(section.name)}
                  className="flex w-full items-center gap-1.5 bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                >
                  <ChevronRight className={`size-3.5 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide text-slate-600 uppercase">{section.name}</span>
                  {section.needsReviewCount > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      {section.needsReviewCount} review
                    </span>
                  )}
                  <span className="shrink-0 text-[11px] text-slate-400">{section.fields.length}</span>
                </button>
                {expanded &&
                  section.fields.map((field) => {
                    const selected = field.id === selectedFieldId
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => onSelect(field.id)}
                        aria-current={selected}
                        className={`block w-full border-t border-slate-100 px-4 py-3 text-left transition-colors ${
                          selected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-[11px] tracking-wide text-slate-400 uppercase">{field.formLine}</p>
                        <p className="mt-0.5 truncate text-sm font-medium text-slate-900">{field.label}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-slate-600">{field.value}</p>
                          <FieldStateBadge state={field.state} />
                        </div>
                      </button>
                    )
                  })}
              </div>
            )
          })
        )}
      </div>
    </nav>
  )
}
