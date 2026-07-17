# Tax Platform Case Study

## What this is
A frontend prototype for GreenGrowth CPAs' AI Engineer case study: designing pieces of an
AI-powered tax platform for CPAs and their clients, from scratch. No specific challenges were
assigned to me — I'm building all 10 from the brief's "Overview of Challenges."

## Ground rules from the brief
- The frontend is what's graded — visual design, interaction design, IA, UX quality.
- No real backend, no real AI, no real auth. Hardcode everything with realistic mock data.
- Simulate AI outputs (confidence scores, extraction, warnings) as plausible fake data.
- Must be a working, clickable prototype, not static mockups.
- Enough data variety and edge cases that it's genuinely testable, not one happy path.
- Ship with a README explaining what's real vs. simulated, and the key decisions.

## Stack
React + TypeScript + Vite + Tailwind CSS v4 + React Router. No backend, no database.

## Conventions
- All mock data lives in src/data/, typed via src/types.ts.
- One shared design system for state badges (AI-generated / verified / locked / editable) —
  every screen imports from it, nobody invents one-off styling.
- Commit after each phase is working, not at the end.
