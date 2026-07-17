export type StaffRole = 'preparer' | 'reviewer' | 'partner' | 'admin'

export interface TeamMember {
  id: string
  name: string
  role: StaffRole
  initials: string
}

export type ClientType = 'individual' | 'business'

export interface Client {
  id: string
  name: string
  type: ClientType
  email: string
  phone?: string
  isNewClient: boolean
  isStaffMember: boolean
  staffMemberId?: string
  createdAt: string
}

export type EntityType = 'individual' | 's-corp' | 'c-corp' | 'partnership' | 'trust'

export type ReturnStatus =
  | 'not-started'
  | 'gathering-documents'
  | 'in-preparation'
  | 'in-review'
  | 'client-action-needed'
  | 'on-extension'
  | 'ready-to-file'
  | 'filed'

export type IssueSeverity = 'high' | 'medium' | 'low'

export interface BlockingIssue {
  id: string
  description: string
  severity: IssueSeverity
  relatedFieldId?: string
  createdAt: string
  resolved: boolean
}

export type QuestionAskedBy = 'preparer' | 'reviewer' | 'client'

export interface OpenQuestion {
  id: string
  question: string
  askedBy: QuestionAskedBy
  askedByName: string
  relatedFieldId?: string
  createdAt: string
  status: 'open' | 'answered'
  answer?: string
  answeredAt?: string
}

export interface Return {
  id: string
  clientId: string
  entityType: EntityType
  taxYear: number
  status: ReturnStatus
  dueDate: string
  extendedDueDate?: string
  preparerId: string
  reviewerId?: string
  blockingIssues: BlockingIssue[]
  openQuestions: OpenQuestion[]
  fields: ReturnField[]
  createdAt: string
  updatedAt: string
}

export type FieldState = 'ai-extracted' | 'needs-review' | 'verified' | 'client-provided' | 'locked'

export interface FieldSource {
  documentId: string
  page: number
  snippet: string
}

export type FieldWarningSeverity = 'info' | 'warning' | 'critical'

export interface FieldWarning {
  id: string
  severity: FieldWarningSeverity
  message: string
}

export type EditActorType = 'ai' | 'preparer' | 'reviewer' | 'client'

export interface EditHistoryEntry {
  id: string
  timestamp: string
  actorType: EditActorType
  actorName: string
  previousValue: string
  newValue: string
  note?: string
}

export interface ReturnField {
  id: string
  formLine: string
  label: string
  value: string
  state: FieldState
  source?: FieldSource
  transformationExplanation?: string
  aiConfidence?: number
  aiReasoning?: string
  warnings: FieldWarning[]
  editHistory: EditHistoryEntry[]
}

export type DocumentType =
  | 'w-2'
  | '1099-nec'
  | '1099-int'
  | '1099-div'
  | '1099-b'
  | '1098'
  | 'k-1'
  | 'receipt'
  | 'prior-year-return'
  | 'bank-statement'
  | 'other'

export type DocumentStatus = 'processing' | 'processed' | 'needs-attention'

export interface SourceDocument {
  id: string
  clientId: string
  returnId: string
  fileName: string
  documentType: DocumentType
  uploadedAt: string
  uploadedBy: EditActorType
  pageCount: number
  status: DocumentStatus
  thumbnailUrl?: string
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  returnId?: string
  clientId?: string
  assigneeId: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdAt: string
  relatedFieldId?: string
}
