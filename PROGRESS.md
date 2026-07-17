# Progress Log

A running log of what's been built, updated after every commit. For static ground rules and
conventions, see `CLAUDE.md` — this file is the history, that one is the constitution.

## Current status

All 7 prioritized challenges (see `CLAUDE.md`) have a working implementation:

- **07 Actionable Dashboard** — done (explainable priority scoring, stat-card filters, search)
- **01 Source Document Traceability** — done (document/page/snippet excerpts + a deterministic
  text-match check, independent of the AI's own confidence score)
- **10 Trustworthy AI** — done (confidence + reasoning, an AI-flagged conflict case, an honest
  low-confidence case, and the deterministic traceability check)
- **08 Clickable vs. Editable** — done (field-state badges + inline "correct this value" editing,
  locked fields visibly inert)
- **06 Return Status & Progress** — done (one shared `StageTimeline` component, full and compact)
- **05 Role-Aware Experiences** — done (preparer dashboard vs. client portal, same data,
  translated lens; Priya Nair proves staff get no special treatment)
- **03 Where to Start** — done (the dashboard's priority score for preparers; the onboarding
  checklist for a brand-new client)

Not started: the 3 stretch goals (02 Collaboration, 04 Navigation, 09 Complexity at Scale) —
deferred per the CLAUDE.md scope decision, only worth picking up if time remains after the core 7
are solid.

**What's next:** no phase is currently in progress. Candidates for a next pass: broaden
field-level detail beyond the 4 fully-fleshed returns; revisit whether a light-touch version of
any stretch goal is worth it; a general polish/consistency pass across all screens.

---

## Log

### `384af00` — Add deterministic source-traceability check, distinct from AI confidence
Built `src/lib/traceability.ts` — a plain, non-AI substring-match check (normalize `$` / commas /
whitespace / case, then check containment) verifying whether a field's claimed value actually
appears in its cited source snippet. Surfaced on the return-review field detail panel as a binary
pass/fail badge, not a percentage/meter, so it can't be mistaken for a second AI confidence score.

Non-obvious decisions:
- Rendered as a flat badge rather than a meter — the *shape* of the UI (binary vs. graduated) does
  as much work as color in keeping "what the AI believes" and "an independent text check"
  visually distinct.
- Two fields already failed this check for legitimate, pre-existing reasons (Dana Ruiz's mileage
  estimate from a damaged photo; Marcus Webb's capital gains, a computed value never literally
  quoted in its source) — documented with code comments rather than "fixed," since fabricating
  data to make them pass would have hidden a real, honest limitation of substring matching.
- The one deliberately-injected mismatch (Dana Ruiz's supplies expense, value changed to `621.47`
  against a `612.47` source) kept `state: 'verified'` and a high `aiConfidence` on purpose — the
  point is that the check catches something even past a human sign-off and a confident AI
  extraction. Had to also update that field's existing edit-history entry to match, so the
  current value and its own history didn't silently disagree.

### `ad39c1f` — Write the README: scope, real vs. simulated, and a decision log
Full project README: the 7-of-10 scope decision, a real-vs-simulated breakdown, and a 6-entry
decision log (status-driven scoring modifiers, the on-extension/gathering-documents blocked-
overlay line, the separate client-vocabulary map, reusing `transformationExplanation` verbatim,
New Horizons over Carlos for onboarding, promoting mock data into a Context).

Non-obvious decisions:
- Written as a decision log (tradeoff + alternative rejected + why), not a feature list — a
  feature list doesn't show the judgment calls a grader would want to see reasoned through.

### `d71cdff` — Add first-time onboarding experience for brand-new clients
`NewClientOnboarding` — a fundamentally different client-portal experience (one next action front
and center, a 3-step checklist that visibly progresses) gated on `Client.isNewClient`, used for
New Horizons Bakery LLC.

Non-obvious decisions:
- Chose New Horizons Bakery over Carlos Mendoza (both flagged `isNewClient`) because its return
  status is `not-started` — the cleanest "no activity yet" signal — versus Carlos's
  `gathering-documents`, which implies work already began and stalled 93 days overdue. Using
  Carlos would have conflated "brand new" with "overdue and troubled."
- Interactions are real, not decorative: identity verification has a simulated async delay, file
  upload uses an actual native file input and echoes the chosen filename, and the two intake
  questions only mark the step done once both are answered.

### `5cd3dc5` — Add client-facing portal: a second role-aware experience on the same data
`/portal` route, a persistent "switch view" bar (`ViewSwitcher`) deriving preparer/client mode
from the URL rather than separate state, a `PortalSessionContext` for the logged-in-as client, and
a translated field view (`ClientFieldRow`) with its own plain-language vocabulary.

Non-obvious decisions:
- `ViewSwitcher` derives mode from `location.pathname` instead of tracking a parallel state flag —
  structurally impossible for the displayed mode to drift from the actual URL.
- Deliberately duplicated a small 5-entry `CLIENT_STATUS_TEXT` map rather than parameterizing the
  shared, preparer-facing `FIELD_STATE_CONFIG` — keeps the audience boundary real instead of just
  conventional, at the cost of a small amount of duplication.
- Reused `transformationExplanation` verbatim for the client view rather than writing parallel
  copy, since it was already written in plain language with no preparer jargon in any of the 4
  fleshed returns.
- Priya Nair (a firm employee with her own personal return, prepared by James Whitfield rather
  than herself) is one of the sample logins specifically to prove the client lens gives her zero
  special treatment.

### `135d443` — Add shared StageTimeline component; wire into dashboard and review screen
`StageTimeline` (`src/design-system/`) — one component, a `compact` prop, rendering the return
lifecycle as 5 client-facing stages (Documents → Preparation → Review → Ready to file → Filed),
reused in both the return-review header and each dashboard row.

Non-obvious decisions:
- `gathering-documents` and `client-action-needed` both render as a "blocked" overlay on whichever
  stage they interrupt rather than a 6th stage bubble, since both really mean "waiting on the
  client." `on-extension` deliberately does NOT get this treatment — it's an administrative flag
  (deadline moved), not the client owing the firm anything — a judgment call beyond what was
  literally specified, reasoned from the same underlying principle.
- `filed` marks the entire track complete, not just the last bubble as current.
- Colors/copy pulled directly from the existing `RETURN_STATUS_CONFIG` (label/description), not
  duplicated — one source of truth for the "why" text shown in both the badge tooltip and the
  timeline tooltip.

### `5dab3fd` — Build the return review screen: two-panel field list + detail, inline editing
`/returns/:returnId` — a field list (left) + full field detail (right): value, plain-language
transformation explanation, AI confidence meter + reasoning, warnings, source document excerpt
(name/page/snippet), edit history, and inline "click to correct this value" editing.

Non-obvious decisions:
- Promoted the mock `returns` array from a static import into a `ReturnsDataProvider` React
  Context — needed so a saved edit persists across navigation and is reflected in that return's
  dashboard priority score immediately, rather than resetting on every visit.
- Locked fields render with a persistent lock icon and "Locked — can't be edited" text, not just a
  disabled-looking style — has to be unambiguous without requiring a hover.
- Saving an edit always flips state to `verified` and appends an edit-history entry attributed to
  the current user (reusing `CurrentUserContext`), regardless of the field's prior state.

### `f717a4a` — Add realistic mock data: 12 returns, 4 fully fleshed with field traceability
5 team members, 12 clients, 18 source documents, 12 returns (all 8 statuses, all 5 entity types
represented), 9 tasks. 4 returns fully fleshed to the field level with real document/page/snippet
traceability.

Non-obvious decisions:
- The 4 fleshed returns were each built around a distinct "trustworthy AI" scenario, not
  interchangeable happy paths: Sarah Chen (clean high-confidence extraction + a locked +
  client-provided field), Marcus Webb (AI flags a conflict between two source documents instead
  of silently picking one), Dana Ruiz (an honestly low-confidence estimate from a damaged
  document), Ridgeline Landscaping LLC (a filed return, every field locked, full edit-history
  lifecycle).
- Priya Nair (a preparer) is also modeled as a client with her own personal return, deliberately
  assigned to a different preparer (James Whitfield) — models a real segregation-of-duties
  concern the data needed to support before any UI could demonstrate it.
- Filed returns intentionally get a full `ai-extracted → verified → locked` edit-history chain per
  field, not just a final state, so the review screen has something real to show.

### `837e5e3` — Scope CLAUDE.md to 7 prioritized challenges, rest as stretch goals
Narrowed from "build all 10 challenges" to 7, prioritizing depth over coverage, with 02
Collaboration / 04 Navigation / 09 Complexity at Scale as stretch goals only if time allows.

### `599c1d6` — Add shared data model and status badge design system
`src/types.ts` (Return, ReturnField, SourceDocument, Task, Client, TeamMember) and a shared badge
system (`FieldStateBadge`, `ReturnStatusBadge`, a generic `Tooltip`) — one visual language every
later screen reuses instead of inventing its own.

Non-obvious decisions:
- `ReturnField` is a flat interface with optional AI-related fields, not a discriminated union
  keyed on `state` — simpler for generating mock data and for every consumer, at the cost of not
  statically preventing e.g. a `locked` field from having `aiConfidence` (the right tradeoff for a
  UI prototype, not a production API).
- Badge colors are organized around a small set of anchor meanings shared across both the field
  and return-status families (emerald = done, slate = neutral/inert, violet = client-involved,
  amber = needs firm attention) rather than 13 independently-chosen hues.

### `f7f2472` — Add CLAUDE.md with case study context and project conventions
CLAUDE.md: ground rules from the brief, stack, and conventions (mock data location, one shared
design system for badges, commit after each phase).

### `909ca1c` — Scaffold Vite + React + TypeScript + Tailwind v4 + React Router
Project scaffold; verified `npm run build` and `npm run dev` both work clean before any feature
code was written.
