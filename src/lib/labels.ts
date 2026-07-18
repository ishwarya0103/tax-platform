import type { DocumentType, EntityType } from '../types'

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  individual: 'Individual',
  's-corp': 'S-Corp',
  'c-corp': 'C-Corp',
  partnership: 'Partnership',
  trust: 'Trust',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'w-2': 'W-2',
  '1099-nec': '1099-NEC',
  '1099-int': '1099-INT',
  '1099-div': '1099-DIV',
  '1099-b': '1099-B',
  '1098': '1098',
  'k-1': 'Schedule K-1',
  receipt: 'Receipt',
  'prior-year-return': 'Prior-year return',
  'bank-statement': 'Bank statement',
  other: 'Other',
}
