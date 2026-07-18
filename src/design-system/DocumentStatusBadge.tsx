import type { DocumentStatus } from '../types'
import { DOCUMENT_STATUS_CONFIG } from './tokens'
import { StatusBadge } from './StatusBadge'

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <StatusBadge {...DOCUMENT_STATUS_CONFIG[status]} />
}
