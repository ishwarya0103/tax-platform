import { FieldStateBadge } from '../../design-system'
import type { ReturnField } from '../../types'

interface FieldListProps {
  fields: ReturnField[]
  selectedFieldId: string | null
  onSelect: (fieldId: string) => void
}

export function FieldList({ fields, selectedFieldId, onSelect }: FieldListProps) {
  return (
    <nav className="w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
      {fields.map((field) => {
        const selected = field.id === selectedFieldId
        return (
          <button
            key={field.id}
            type="button"
            onClick={() => onSelect(field.id)}
            aria-current={selected}
            className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${
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
    </nav>
  )
}
