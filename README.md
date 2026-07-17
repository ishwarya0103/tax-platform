# Tax Platform

A frontend-only prototype of an AI-powered tax platform for GreenGrowth CPAs, built for their AI
Engineer case study. It covers two connected experiences on one shared data model: a preparer-facing
workspace (dashboard, return review, inline correction) and a client-facing portal (status,
plain-language field detail, first-time onboarding) — reachable from the same app via a visible
"switch view" control standing in for login.

There is no backend. Everything — returns, clients, documents, AI outputs — is hardcoded
TypeScript data, and the "server" is a React Context holding that data in memory for the session.

## Scope: 7 of 10 challenges

No specific challenges were assigned, so I chose 7 of the 10 from the brief's "Overview of
Challenges" and prioritized depth over coverage — one connected, well-reasoned app where the
pieces inform each other, rather than ten shallow screens with no shared spine. Concretely: the
mock data, status vocabulary, and badge system built early on get reused by everything built
later, which wouldn't have been possible (or wouldn't have been worth as much) spread across all
ten.

Built:

| # | Challenge | Where |
|---|---|---|
| 07 | Actionable Dashboard | `src/pages/Dashboard.tsx` — priority scoring, stat-card filters, search |
| 01 | Source Document Traceability | `src/components/return-review/FieldDetail.tsx` — document name, page, exact snippet per field |
| 10 | Trustworthy AI | Confidence meter + reasoning, the AI-flags-a-conflict case, the honest-low-confidence case |
| 08 | Clickable vs. Editable | `FieldStateBadge` states + inline "correct this value" flow, locked fields visibly inert |
| 06 | Return Status & Progress | `src/design-system/StageTimeline.tsx` — one shared component, two audiences |
| 05 | Role-Aware Experiences | `src/pages/ClientPortal.tsx` + `ViewSwitcher` — same data, translated lens |
| 03 | Where to Start | The dashboard's priority score for preparers; `NewClientOnboarding` for a brand-new client |

Deferred as stretch goals (not built): 02 Collaboration, 04 Navigation, 09 Complexity at Scale.
These are real gaps, not oversights — Collaboration in particular would build on the open
questions already modeled in the data, but a reply/thread UI is a meaningfully separate scope of
work from anything above.

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

**Simulated / hardcoded** (plausible fake data standing in for real systems):

- Every `Return`, `Client`, `SourceDocument`, `Task`, and `TeamMember` in `src/data/` — invented,
  not derived from anything.
- Every AI output: confidence scores, `aiReasoning`, `transformationExplanation`, warnings, and the
  extracted document snippets themselves. No model ever ran; these are authored to be plausible,
  including the low-confidence and conflicting cases, not just the clean ones.
- Authentication — the "switch view" control and its 4 sample logins stand in for real login, per
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
  (a filed return, fully locked).
- **Client view**: use the "switch view" control in the top bar. Sample logins: Sarah Chen, Dana
  Ruiz, Priya Nair (a firm employee with her own personal return, prepared by a colleague — visible
  proof that staff get no special treatment in this view), and New Horizons Bakery LLC (the
  brand-new-client onboarding flow).
