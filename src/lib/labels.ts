import type { EntityType } from '../types'

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  individual: 'Individual',
  's-corp': 'S-Corp',
  'c-corp': 'C-Corp',
  partnership: 'Partnership',
  trust: 'Trust',
}
