import type { MessageThread } from '../types'

export const messageThreads: MessageThread[] = [
  // ── Dana Ruiz — the requested scenario: asking for a clearer mileage photo ──
  {
    id: 'thread-dana-mileage-photo',
    returnId: 'ret-dana-ruiz-2025',
    subject: 'Clearer mileage log needed',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-dana-mileage-deduction',
    relatedDocumentId: 'doc-dana-mileagelog',
    messages: [
      {
        id: 'msg-dana-mileage-1',
        authorType: 'preparer',
        authorName: 'Tom Delgado',
        body: 'Can you send a clearer photo or the original mileage log? The one on file is blurry and cut off in a few places.',
        createdAt: '2026-07-16T10:06:00Z',
      },
    ],
    createdAt: '2026-07-16T10:06:00Z',
    updatedAt: '2026-07-16T10:06:00Z',
  },

  // ── Marcus Webb — the requested scenario: internal note + a separate client ask ──
  {
    id: 'thread-marcus-1099-conflict-internal',
    returnId: 'ret-marcus-webb-2025',
    subject: '1099-INT conflict — how do we resolve?',
    visibility: 'internal',
    status: 'open',
    relatedFieldId: 'field-marcus-interest-income',
    relatedDocumentId: 'doc-marcus-1099int-corrected',
    messages: [
      {
        id: 'msg-marcus-internal-1',
        authorType: 'preparer',
        authorName: 'Alicia Kim',
        body: "Two 1099-INTs on file for Marcus's Fidelity account — original shows $1,240, corrected shows $1,340. I used the corrected figure but flagged it since a $100 unexplained jump is unusual for a true correction. Can you take a look before we finalize?",
        createdAt: '2026-07-15T14:00:00Z',
      },
      {
        id: 'msg-marcus-internal-2',
        authorType: 'reviewer',
        authorName: 'James Whitfield',
        body: "Agreed, that's a bigger gap than I'd expect from a typical correction. Let's ask Marcus directly whether he received any notice explaining the change, rather than assuming the corrected form is right.",
        createdAt: '2026-07-16T09:15:00Z',
      },
    ],
    createdAt: '2026-07-15T14:00:00Z',
    updatedAt: '2026-07-16T09:15:00Z',
  },
  {
    id: 'thread-marcus-1099-conflict-client',
    returnId: 'ret-marcus-webb-2025',
    subject: 'Quick question about your 1099-INT',
    visibility: 'client-visible',
    status: 'open',
    relatedFieldId: 'field-marcus-interest-income',
    relatedDocumentId: 'doc-marcus-1099int-corrected',
    messages: [
      {
        id: 'msg-marcus-client-1',
        authorType: 'preparer',
        authorName: 'Alicia Kim',
        body: 'We received two 1099-INT forms from Fidelity for your account with different interest amounts ($1,240 and $1,340). Did you receive any notice from Fidelity explaining a correction? Just want to make sure we report the right figure.',
        createdAt: '2026-07-16T09:30:00Z',
      },
    ],
    createdAt: '2026-07-16T09:30:00Z',
    updatedAt: '2026-07-16T09:30:00Z',
  },

  // ── The rest — migrated 1:1 from the old openQuestions data, same content ──
  {
    id: 'thread-owen-k1-distribution',
    returnId: 'ret-owen-ridgeline-2025',
    subject: 'K-1 distribution already reported?',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      {
        id: 'msg-owen-k1-1',
        authorType: 'preparer',
        authorName: 'Priya Nair',
        body: 'Can you confirm whether the $18,400 distribution from Ridgeline Landscaping shown on your K-1 was already reported elsewhere?',
        createdAt: '2026-07-12T15:00:00Z',
      },
    ],
    createdAt: '2026-07-12T15:00:00Z',
    updatedAt: '2026-07-12T15:00:00Z',
  },
  {
    id: 'thread-callahan-distributions',
    returnId: 'ret-callahan-trust-2025',
    subject: 'Final distribution amounts needed',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      {
        id: 'msg-callahan-1',
        authorType: 'preparer',
        authorName: 'Alicia Kim',
        body: 'The trustee needs to confirm final distribution amounts to beneficiaries before we finalize the Schedule K-1s.',
        createdAt: '2026-07-08T09:00:00Z',
      },
    ],
    createdAt: '2026-07-08T09:00:00Z',
    updatedAt: '2026-07-08T09:00:00Z',
  },
  {
    id: 'thread-carlos-extension',
    returnId: 'ret-carlos-mendoza-2025',
    subject: 'File an extension?',
    visibility: 'client-visible',
    status: 'open',
    messages: [
      {
        id: 'msg-carlos-1',
        authorType: 'preparer',
        authorName: 'Alicia Kim',
        body: 'Do you want us to file Form 4868 for an extension, since the original deadline has already passed?',
        createdAt: '2026-07-15T09:05:00Z',
      },
    ],
    createdAt: '2026-07-15T09:05:00Z',
    updatedAt: '2026-07-15T09:05:00Z',
  },
  {
    // Reclassified from the old data's ambiguous "openQuestion" (which had no
    // internal/external distinction at all) to 'internal': this is a reviewer
    // asking the preparer to double-check a compliance detail on the S-corp
    // return before filing — never something Ridgeline Landscaping's own
    // client-portal user would see.
    id: 'thread-ridgeline-basis-check',
    returnId: 'ret-ridgeline-landscaping-2025',
    subject: 'Confirm shareholder basis before filing',
    visibility: 'internal',
    status: 'answered',
    relatedFieldId: 'field-ridgeline-distributions',
    messages: [
      {
        id: 'msg-ridgeline-basis-1',
        authorType: 'reviewer',
        authorName: 'Emma Ortiz',
        body: "Confirm shareholder distribution didn't exceed Owen's stock basis before we finalize.",
        createdAt: '2026-02-20T09:00:00Z',
      },
      {
        id: 'msg-ridgeline-basis-2',
        authorType: 'preparer',
        authorName: 'Priya Nair',
        body: 'Confirmed — distribution is within basis; no capital gain triggered.',
        createdAt: '2026-02-22T11:30:00Z',
      },
    ],
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-22T11:30:00Z',
  },
]
