import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  count: number
  icon: LucideIcon
  active: boolean
  activeClassName: string
  iconClassName: string
  onClick: () => void
}

export function StatCard({ label, count, icon: Icon, active, activeClassName, iconClassName, onClick }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
        active ? activeClassName : 'border-slate-200 bg-white hover:bg-slate-50'
      }`}
    >
      <Icon className={`size-5 ${iconClassName}`} aria-hidden="true" />
      <div>
        <div className="text-2xl font-semibold text-slate-900">{count}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </button>
  )
}
