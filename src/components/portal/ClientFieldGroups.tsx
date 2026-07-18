import { useState } from 'react'
import { ChevronRight, Search } from 'lucide-react'
import { deriveFormSection } from '../../lib/fieldGrouping'
import type { ReturnField } from '../../types'
import { ClientFieldRow } from './ClientFieldRow'

interface Group {
  name: string
  fields: ReturnField[]
}

function buildGroups(fields: ReturnField[]): Group[] {
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
  return order.map((name) => ({ name, fields: bySection.get(name)! }))
}

// A handful of fields (Sarah Chen, Marcus Webb, etc.) render fine as one flat
// list — grouping and search only add friction below this size. Above it,
// a flat list of hundreds of rows (Meridian Hospitality's ~280 fields) turns
// into an unusable wall, so this threshold decides which experience a given
// return gets.
const GROUPING_THRESHOLD = 20

export function ClientFieldGroups({ fields }: { fields: ReturnField[] }) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (fields.length <= GROUPING_THRESHOLD) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {fields.map((field) => (
          <ClientFieldRow key={field.id} field={field} />
        ))}
      </div>
    )
  }

  const q = query.trim().toLowerCase()
  const groups = buildGroups(fields)
  const visibleGroups = q
    ? groups.map((g) => ({ ...g, fields: g.fields.filter((f) => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q)) })).filter((g) => g.fields.length > 0)
    : groups

  function toggle(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your return…"
          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-sm text-slate-700 placeholder:text-slate-400"
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {visibleGroups.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing matches "{query}".</p>
        ) : (
          visibleGroups.map((group) => {
            const isExpanded = Boolean(q) || expanded.has(group.name)
            return (
              <div key={group.name} className="border-b border-slate-100 last:border-b-0">
                <button type="button" onClick={() => toggle(group.name)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-50">
                  <ChevronRight className={`size-3.5 shrink-0 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{group.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{group.fields.length}</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {group.fields.map((field) => (
                      <ClientFieldRow key={field.id} field={field} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
