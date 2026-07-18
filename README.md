# Tax Platform

A frontend-only prototype of an AI-powered tax platform for GreenGrowth CPAs, built for their AI
Engineer case study. It covers two connected experiences on one shared data model: a preparer-facing
workspace (dashboard, return review, inline correction) and a client-facing portal (status,
plain-language field detail, first-time onboarding) — reachable from the same app via a visible
"switch view" control standing in for login.

There is no backend. Everything — returns, clients, documents, AI outputs — is hardcoded
TypeScript data, and the "server" is a React Context holding that data in memory for the session.

## Scope: all 10 challenges

No specific challenges were assigned. I started by choosing 7 of the 10 from the brief's
"Overview of Challenges" and prioritizing depth over coverage — one connected, well-reasoned app
where the pieces inform each other, rather than ten shallow screens with no shared spine. The
remaining 3 (Collaboration, Navigation, Complexity at Scale) were explicitly scoped as stretch
goals, only worth picking up if time allowed. It did, and all 3 got built on top of the same
shared spine rather than as bolted-on afterthoughts: Collaboration's message-thread model became
the backbone Navigation's deep links jump between, and Complexity at Scale's 279-field return
reuses the exact same field/state model as the other 4 returns, just generated instead of
hand-authored.

| # | Challenge | Where |
|---|---|---|
| 07 | Actionable Dashboard | `src/pages/Dashboard.tsx` — priority scoring, stat-card filters, search |
| 09 | Complexity at Scale | A 279-field, 40-document, 30-thread return (Meridian Hospitality Group LLC); search/filter/collapsible grouping in the field list, documents panel, and client portal |
| 04 | Navigation | Depth-aware breadcrumbs, bidirectional field↔thread deep links, `location.state`-preserved dashboard filters |
| 01 | Source Document Traceability | `src/components/return-review/FieldDetail.tsx` — document name, page, exact snippet per field |
| 10 | Trustworthy AI | Confidence meter + reasoning, the AI-flags-a-conflict case, the honest-low-confidence case |
| 08 | Clickable vs. Editable | `FieldStateBadge` states + inline "correct this value" flow, locked fields visibly inert |
| 06 | Return Status & Progress | `src/design-system/StageTimeline.tsx` — one shared component, two audiences |
| 05 | Role-Aware Experiences | `src/pages/ClientPortal.tsx` + `ViewSwitcher` — same data, translated lens |
| 03 | Where to Start | The dashboard's priority score for preparers; `NewClientOnboarding` for a brand-new client |
| 02 | Collaboration | `MessageThread`/`Message` model — internal vs. client-visible, tied to fields/documents, backing both the return-review screen and the client portal |

## What's real vs. simulated

**Real logic** (actual code that computes something, not just renders hardcoded data):

- The dashboard's priority scoring (`src/lib/scoring.ts`) — a genuine tiered function combining
  due-date pressure, unresolved blocking issues by severity, open questions by who owes the reply,
  and a status modifier. Every score is auditable via its tooltip breakdown, not a black box.
- The stage-timeline mapping (`src/design-system/StageTimeline.tsx`) — real logic deciding which
  of 8 granular statuses maps to which of 5 client-facing stages, and whether it's blocked.
- The client-portal translation layer (`src/components/portal/ClientFieldRow.tsx`, and the
  filtering in `ClientPortal.tsx`) — real logic deciding what a client sees vs. a preparer, not a
  parallel copy of the same screen.
- The inline edit flow (`src/context/ReturnsDataContext.tsx`) — saving a corrected value for real
  updates state, flips the field to `verified`, and appends a real edit-history entry; it persists
  across navigation for the session (dashboard scores update immediately after an edit) but resets
  on page reload, since there's no backend to persist it further.
- Dashboard filtering, sorting, and search — real, operating on the in-memory data.
- Message-thread logic (`src/lib/messages.ts`) — `nextActionOwner` and `threadsNeedingClientAction`
  are computed from a thread's actual messages every time, not stored fields that could drift out
  of sync with the conversation.
- Navigation state (`src/pages/Dashboard.tsx`, `src/pages/ReturnReview.tsx`) — breadcrumbs, deep
  links between a field and any thread discussing it, and the dashboard's scope/filter/search
  restoring correctly after a multi-level round trip are all real `location.state`/URL-param logic,
  not decorative links.
- Field/document/thread list behavior at scale (`src/lib/fieldGrouping.ts`,
  `src/components/return-review/FieldList.tsx`, `MessageThreadList.tsx`, `DocumentList.tsx`,
  `src/components/portal/ClientFieldGroups.tsx`) — search, filtering, section-grouping, and
  collapse/expand all genuinely operate on and reshape the underlying data; nothing here is a
  static mockup of what a big return would look like.

**Simulated / hardcoded** (plausible fake data standing in for real systems):

- Every `Return`, `Client`, `SourceDocument`, `Task`, and `TeamMember` in `src/data/` — invented,
  not derived from anything.
- Every AI output: confidence scores, `aiReasoning`, `transformationExplanation`, warnings, and the
  extracted document snippets themselves. No model ever ran; these are authored to be plausible,
  including the low-confidence and conflicting cases, not just the clean ones.
- Meridian Hospitality Group LLC's ~280 fields, 40 documents, and 30 threads
  (`src/data/generators/meridian.ts`) — the bulk is produced by a template-driven generator rather
  than hand-authored, but the generator is just a more efficient way to author fake data at volume;
  none of it is derived from a real return, and about a dozen fields have hand-crafted edge cases
  layered on top for the same reason the 4 smaller returns do (see decision log below).
- Authentication — the "switch view" control and its sample logins stand in for real login, per
  the brief.
- Document upload in the new-client checklist reads a real file's name via a native file input but
  never stores or transmits it anywhere.

## Design decisions

A decision log, not a feature list — the reasoning behind the calls that had a real tradeoff.

**1. The priority score actively reorders the dashboard by status, not just by date.**
`client-action-needed` gets a flat −20 modifier ("nothing more to do until they respond"); 
`ready-to-file` gets +15 ("quick win"). Alternative considered: score purely from due-date pressure
and issue counts, treating status as informational only. Rejected because two returns with
identical due dates and identical blocking-issue counts can need completely different action from
a preparer today — the whole point of this challenge was "what should I work on," not "what's
status." The modifiers are arbitrary point values with no universal correct weighting, which is
exactly why the tooltip shows the full reasoning breakdown rather than just a number.

**2. `on-extension` doesn't get the "blocked" overlay treatment; `gathering-documents` does.**
The brief only named `client-action-needed` as the case that should overlay rather than get its
own stage bubble. I generalized that to `gathering-documents` too, since it's equally "we're
waiting on the client," just at an earlier stage. I deliberately did *not* extend it to
`on-extension` — that status means the deadline moved, not that the client owes the firm
anything, so treating it as blocked would have been overreach applying the same rule to a
status it doesn't actually describe. Someone could reasonably disagree with where I drew this
line; it's recorded here because it's a judgment call past what was explicitly specified.

**3. A separate `CLIENT_STATUS_TEXT` map instead of reusing `FIELD_STATE_CONFIG`.**
The preparer-facing field-state config (`needs-review`, `locked`, etc.) is shared, load-bearing
design-system infrastructure — every preparer screen imports its labels and colors. Parameterizing
it with a second, client-facing label set would have been less code, but it would have coupled two
audiences' vocabularies in one place, and the whole point of this challenge was keeping preparer
jargon from leaking into the client view. A second five-line lookup was the right amount of
duplication to keep that boundary real instead of just convention-enforced.

**4. `transformationExplanation` is shown to clients verbatim — no parallel copy was written.**
It turned out, on inspection, that the field's plain-language transformation explanation
(originally written for the preparer's field-detail panel) already contained no preparer jargon in
any of the four fully-fleshed returns. Rather than writing a second version for the client portal,
I reused the same string. The risk: one string now serves two audiences, so a future edit written
with only the preparer in mind could introduce jargon that leaks to clients without anyone
noticing. Worth the DRY win for now, but it's the kind of thing that would need a lint rule or a
review checklist in a real product, not just a one-time check.

**5. New Horizons Bakery, not Carlos Mendoza, demonstrates the new-client onboarding.**
Both are flagged `isNewClient`, but Carlos's return status is `gathering-documents` — already
active, already 93 days overdue, with a real blocking issue and an open question about filing an
extension. New Horizons's status is `not-started`, the cleanest "no activity yet" signal in the
data. Using Carlos would have conflated two different problems — "this client is brand new" and
"this client's return is badly overdue and stalled" — into one screen. Isolating the onboarding
case to a client with a genuinely clean slate kept the demonstration honest about what it was
actually showing.

**6. Mock `returns` data lives in a React Context, not a static import.**
Once the return-review screen needed real inline editing, an edit had to survive navigating back
to the dashboard and be reflected in that return's priority score — a static import re-read on
every render can't do that. The alternative was component-local state that reset on every visit,
which would have made "editable" a lie the moment you clicked away. The Context is a small
concession to plumbing in an otherwise backend-free app, justified directly by the brief's "must be
a working, clickable prototype, not static mockups."

**7. A `MessageThread`/`Message` model with visibility on the thread, replacing a flat
`OpenQuestion`.** The original data model had one open question per return: a single string with
no sense of who could see it, no reply, no way to represent an internal firm discussion happening
alongside a client-facing one. The alternative — keeping `OpenQuestion` and adding an
`internal: boolean` flag to it — was rejected because a real preparer/reviewer conversation (like
whether to trust a corrected 1099) often needs several back-and-forth messages before anything
client-facing gets sent, and a single boolean flag can't represent "this thread has its own
message history and its own participants," only "hide or show one string." Putting `visibility`
on the thread rather than per-message was deliberate too: mixing internal and client-visible
messages in one conversation is exactly the leak this model exists to prevent, so a thread is
either entirely internal or entirely client-visible, never a mix.

**8. `nextActionOwner` is computed from a thread's messages, not stored as a field.** The
alternative — a `nextActionOwner` field set whenever a message is sent — was rejected because it's
redundant state that has to be kept in sync by hand at every call site that appends a message, and
any missed update silently shows the wrong owner. Deriving it from "who sent the last message,
and is the thread open or internal" means it's structurally impossible for the displayed owner to
drift from the actual conversation. The one non-obvious rule baked into the function: an internal
thread always resolves to `'firm'`, regardless of who posted last, since there's no "client's
turn" concept for a conversation the client can't see.

**9. The "Dashboard" breadcrumb uses `navigate(-1)`, and every in-page field/thread selection uses
`{ replace: true }`.** For "return to where I was" to work — following a link from the dashboard
three levels deep into a specific field, then coming back to the exact same scope/filter/search
and scroll position — the return trip needs to be a real History API back-traversal, not a fresh
`navigate('/')` push, since only a real back-traversal gets native browser scroll restoration for
free. That constrained the rest: if selecting a field or jumping to a thread within the same
return used the default push-based `setSearchParams`, each of those in-page selections would grow
the history stack, and `navigate(-1)` would only undo the last selection instead of actually
leaving the return — a bug I hit and fixed during testing. The fix was making every in-page
selection change use `replace: true`, so only the original "open this return" navigation counts as
one real history entry. The alternative — a custom parallel history stack tracking exactly where
to go back to — was rejected as over-engineering; React Router's own primitives do this once the
push-vs-replace distinction is applied consistently.

**10. Grouping fields by form/schedule section derives the section from the existing `formLine`,
rather than adding a new field to the data model.** A formLine like `"Schedule K-1 (1065), Partner
2 — D. Whitfield, Box 4"` already encodes the section every sibling field shares — stripping the
trailing `"Line N"`/`"Box N"` segment leaves exactly that. The alternative, adding an explicit
`formSection` field to `ReturnField` and backfilling it onto all 4 existing returns' field
literals, was rejected because it would have meant touching every field ever written for no
behavioral gain — the section is fully recoverable from data that already exists. The one
constraint this put on the 279-field generator: formLines had to be written so the derivation
falls out cleanly (e.g. always ending in a literal `"Line N"` or `"Box N"`), which turned out to
be a natural way to write them anyway.

**11. Meridian's ~280 fields are generated from templates, with about a dozen hand-crafted edge
cases layered on top, rather than either fully hand-authored or fully random.** Fully hand-writing
280 fields with the same narrative richness as the 4 smaller returns wasn't a realistic use of
time and would have mostly been repetitive filler; fully random generation was rejected because
random data can't demonstrate anything — the whole point of the 4 existing returns is that each
one shows a specific, real scenario (a conflict, a low-confidence estimate, a traceability
mismatch), and a scale test that's just noise wouldn't test whether those scenarios are still
findable once they're one row out of hundreds. The generator produces plausible bulk data
(deterministically, via a hashed seed per field id, not `Math.random()`, so the dataset is stable
across reloads) and a fixed set of specific fields get overridden with real narratives afterward —
a guaranteed-payment conflict mirroring Marcus Webb's 1099 conflict, a blurry-invoice low-confidence
estimate mirroring Dana Ruiz's mileage photo, and others. Building the generator this way also
surfaced a real bug worth recording: the first hash function correlated badly on ids sharing a
long prefix, clustering most of one form's fields into "needs review" together instead of
scattering at the intended rate — caught by inspecting the generated distribution, fixed with a
proper avalanche-mixing hash.

## Stack

- Vite
- React + TypeScript
- Tailwind CSS v4
- React Router

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Trying it out

- **Preparer view** (default): the dashboard at `/`, with a "Viewing as" switcher for 5 team
  members (mine-vs-team filtering uses `preparerId`/`reviewerId`), and a return review screen at
  `/returns/:returnId` for the 4 fully-fleshed-out returns — Sarah Chen (clean extraction, a
  locked field, a client-provided field), Marcus Webb (an AI-flagged document conflict), Dana Ruiz
  (an honestly low-confidence extraction from a damaged document), and Ridgeline Landscaping LLC
  (a filed return, fully locked) — plus Meridian Hospitality Group LLC, the 279-field, 40-document,
  30-thread scale test: try the field list's search/filter/section-grouping, the collapsed
  documents panel, and jumping between a field and its related conversation and back.
- **Client view**: use the "switch view" control in the top bar. Sample logins: Sarah Chen, Dana
  Ruiz, Priya Nair (a firm employee with her own personal return, prepared by a colleague — visible
  proof that staff get no special treatment in this view), New Horizons Bakery LLC (the
  brand-new-client onboarding flow), and Meridian Hospitality Group LLC (the same scale test, from
  the client's side — search and section-grouping kick in automatically above ~20 fields).
