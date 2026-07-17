import type { StatusVisual } from './tokens'
import { Tooltip } from './Tooltip'

export function StatusBadge({ label, description, icon: Icon, className }: StatusVisual) {
  return (
    <Tooltip content={description}>
      <span
        tabIndex={0}
        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
    </Tooltip>
  )
}
