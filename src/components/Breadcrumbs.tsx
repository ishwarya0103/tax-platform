import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
  onClick?: () => void
}

// The last item is always rendered as plain, non-interactive text — the
// current page — regardless of whether a `to`/`onClick` was supplied for it,
// so callers don't need to conditionally omit them for the final crumb.
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 text-slate-300" aria-hidden="true" />}
            {isLast ? (
              <span className="font-medium text-slate-900">{item.label}</span>
            ) : item.to ? (
              <Link to={item.to} className="text-slate-500 hover:text-slate-700 hover:underline">
                {item.label}
              </Link>
            ) : (
              <button type="button" onClick={item.onClick} className="text-slate-500 hover:text-slate-700 hover:underline">
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
