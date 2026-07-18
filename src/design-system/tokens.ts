import {
  Sparkles,
  CircleAlert,
  CheckCircle2,
  UserRound,
  Lock,
  Circle,
  Inbox,
  PencilLine,
  Eye,
  MessageCircleQuestion,
  CalendarClock,
  ClipboardCheck,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import type { DocumentStatus, FieldState, ReturnStatus } from '../types'

export interface StatusVisual {
  label: string
  description: string
  icon: LucideIcon
  className: string
}

const blue = 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
const amber = 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
const emerald = 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
const violet = 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300'
const slate = 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
const sky = 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300'
const indigo = 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
const orange = 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
const teal = 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300'

export const FIELD_STATE_CONFIG: Record<FieldState, StatusVisual> = {
  'ai-extracted': {
    label: 'AI-extracted',
    description: "Pulled automatically from a source document. Hasn't been reviewed by a person yet.",
    icon: Sparkles,
    className: blue,
  },
  'needs-review': {
    label: 'Needs review',
    description: "Flagged for a preparer or reviewer to double-check before it's used.",
    icon: CircleAlert,
    className: amber,
  },
  verified: {
    label: 'Verified',
    description: 'Confirmed correct by a preparer or reviewer.',
    icon: CheckCircle2,
    className: emerald,
  },
  'client-provided': {
    label: 'Client-provided',
    description: 'Entered directly by the client rather than pulled from a document.',
    icon: UserRound,
    className: violet,
  },
  locked: {
    label: 'Locked',
    description: "Finalized and can't be edited without unlocking it first.",
    icon: Lock,
    className: slate,
  },
}

export const RETURN_STATUS_CONFIG: Record<ReturnStatus, StatusVisual> = {
  'not-started': {
    label: 'Not started',
    description: 'No work has begun on this return yet.',
    icon: Circle,
    className: slate,
  },
  'gathering-documents': {
    label: 'Gathering documents',
    description: 'Waiting on source documents from the client before preparation can begin.',
    icon: Inbox,
    className: sky,
  },
  'in-preparation': {
    label: 'In preparation',
    description: 'A preparer is actively building the return.',
    icon: PencilLine,
    className: indigo,
  },
  'in-review': {
    label: 'In review',
    description: 'A reviewer or partner is checking the return before it goes out.',
    icon: Eye,
    className: amber,
  },
  'client-action-needed': {
    label: 'Client action needed',
    description: 'Waiting on the client to answer a question or provide information.',
    icon: MessageCircleQuestion,
    className: violet,
  },
  'on-extension': {
    label: 'On extension',
    description: 'An extension was filed; the due date has been pushed back.',
    icon: CalendarClock,
    className: orange,
  },
  'ready-to-file': {
    label: 'Ready to file',
    description: 'Fully reviewed and approved — just needs to be filed.',
    icon: ClipboardCheck,
    className: teal,
  },
  filed: {
    label: 'Filed',
    description: 'Filed with the relevant tax authority.',
    icon: CheckCircle2,
    className: emerald,
  },
}

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, StatusVisual> = {
  processing: {
    label: 'Processing',
    description: 'Uploaded, but the system has not finished reading it yet.',
    icon: Clock,
    className: sky,
  },
  processed: {
    label: 'Processed',
    description: 'Successfully read and available as a source for extraction.',
    icon: CheckCircle2,
    className: emerald,
  },
  'needs-attention': {
    label: 'Needs attention',
    description: "Couldn't be fully read (damaged, blurry, or unsupported) — needs a person to look at it.",
    icon: CircleAlert,
    className: amber,
  },
}
