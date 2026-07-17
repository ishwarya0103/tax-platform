import type { FieldState } from '../types'
import { FIELD_STATE_CONFIG } from './tokens'
import { StatusBadge } from './StatusBadge'

export function FieldStateBadge({ state }: { state: FieldState }) {
  return <StatusBadge {...FIELD_STATE_CONFIG[state]} />
}
