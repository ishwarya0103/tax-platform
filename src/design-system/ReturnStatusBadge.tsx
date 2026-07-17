import type { ReturnStatus } from '../types'
import { RETURN_STATUS_CONFIG } from './tokens'
import { StatusBadge } from './StatusBadge'

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <StatusBadge {...RETURN_STATUS_CONFIG[status]} />
}
