# Tax Platform

A frontend-only prototype of an AI-powered tax platform for GreenGrowth CPAs, built for their AI
Engineer case study. It covers two connected experiences on one shared data model: a preparer-facing
workspace (dashboard, return review, inline correction) and a client-facing portal (status,
plain-language field detail, first-time onboarding) — reachable from the same app via a visible
"switch view" control standing in for login.

There is no backend. Everything — returns, clients, documents, AI outputs — is hardcoded
TypeScript data, and the "server" is a React Context holding that data in memory for the session.

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

## How to explore this

### Preparer view (default)

- Switch to "Whole team," click a stat card (e.g. "Blocked") to filter, hover any score chip
  (e.g. Carlos Mendoza's, top of the list) for the point-by-point reasoning behind it.
  (Challenge 07)
- Open Carlos Mendoza's return and note the amber "blocked" stage on the 5-stage timeline.
  (Challenge 06)
- Click a needs-review field (e.g. on Marcus Webb) to see its AI confidence + reasoning.
  (Challenge 10)
- Same field's "Source document" section shows the exact excerpt, plus a separate pass/fail
  traceability badge. (Challenge 01)
- Click a value directly to correct it inline; try a locked field on a filed return to see it
  refuse. (Challenge 08)
- From a field's "Related conversation" link, jump to its thread and back via the breadcrumb.
  (Challenge 04)
- Scroll to Messages — note the "Internal" badge and "Next action: Client/Firm" line.
  (Challenge 02)
- Open Meridian Hospitality Group LLC (279 fields) — search, filter by state, expand a collapsed
  section. (Challenge 09)

### Client view

- Click "Client view" in the top bar, pick any sample login. (Challenge 05)
- Compare a field's wording to the preparer view — no jargon, no confidence numbers, no
  traceability badges. (Challenge 05)
- Pick "Priya Nair (firm employee)" — her own return gets no special treatment here.
  (Challenge 05)
- Pick "New Horizons Bakery LLC" for the brand-new-client onboarding checklist. (Challenge 03)

## The 10 challenges

No specific challenges were assigned. 7 were chosen first, prioritizing depth over coverage; the
remaining 3 (Collaboration, Navigation, Complexity at Scale) were scoped as stretch goals and got
built too, reusing the same shared spine rather than as bolted-on afterthoughts.

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
| 03 | Where to Start | `src/components/portal/NewClientOnboarding.tsx` — a brand-new client's first-time checklist |
| 02 | Collaboration | `MessageThread`/`Message` model — internal vs. client-visible, tied to fields/documents, backing both the return-review screen and the client portal |

## What's real vs. simulated

**Real logic** (actual code that computes something, not just renders hardcoded data):

- Dashboard priority scoring (`src/lib/scoring.ts`) — tiered, auditable via its tooltip breakdown.
- Stage-timeline mapping (`src/design-system/StageTimeline.tsx`) — real status→stage logic,
  including the "blocked" flag.
- Client-portal translation layer (`ClientFieldRow.tsx`, `ClientPortal.tsx`) — real logic on what
  a client sees vs. a preparer, not a parallel copy of the same screen.
- Inline edit flow (`ReturnsDataContext.tsx`) — saves for real, flips state to `verified`, appends
  edit history; persists for the session, resets on reload (no backend).
- Dashboard filtering, sorting, and search — real, over in-memory data.
- Message-thread logic (`src/lib/messages.ts`) — `nextActionOwner` and
  `threadsNeedingClientAction` are computed from a thread's messages, never stored.
- Navigation state (`Dashboard.tsx`, `ReturnReview.tsx`) — breadcrumbs, deep links, and
  scope/filter/search restoration are real `location.state`/URL-param logic.
- Field/document/thread list behavior at scale (`fieldGrouping.ts`, `FieldList.tsx`,
  `MessageThreadList.tsx`, `DocumentList.tsx`, `ClientFieldGroups.tsx`) — search, filtering,
  section-grouping, and collapse/expand all genuinely reshape the underlying data.

**Simulated / hardcoded** (plausible fake data standing in for real systems):

- Every `Return`, `Client`, `SourceDocument`, `Task`, and `TeamMember` in `src/data/` — invented.
- Every AI output: confidence scores, `aiReasoning`, `transformationExplanation`, warnings, and
  extracted snippets. No model ever ran — authored to be plausible, including the low-confidence
  and conflicting cases, not just the clean ones.
- Meridian Hospitality Group LLC's ~280 fields, 40 documents, and 30 threads
  (`src/data/generators/meridian.ts`) — bulk-generated from templates rather than hand-authored,
  with about a dozen hand-crafted edge cases layered on top; still invented, not derived from a
  real return.
- Authentication — the "switch view" control and its sample logins stand in for real login.
- Document upload in the new-client checklist reads a real file's name via a native file input but
  never stores or transmits it anywhere.

---

For the full reasoning behind every non-obvious decision, see `DECISIONS.md`.
