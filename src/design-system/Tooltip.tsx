import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RadixTooltip.Provider delayDuration={200}>{children}</RadixTooltip.Provider>
}

export function Tooltip({
  content,
  children,
  className = 'max-w-64',
}: {
  content: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          sideOffset={6}
          className={`z-50 rounded-md bg-slate-900 px-3 py-1.5 text-xs leading-relaxed text-white shadow-lg dark:bg-slate-100 dark:text-slate-900 ${className}`}
        >
          {content}
          <RadixTooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
