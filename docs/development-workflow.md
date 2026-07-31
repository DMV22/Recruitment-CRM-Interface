# Development Workflow

## Goal

This document defines how AI agents should work in this repository with minimal token and context waste.

## General approach

Prefer narrow, feature-scoped analysis.
Do not scan the whole repository for every task.

For a new task:
1. identify the target feature
2. inspect sibling route(s)
3. inspect sibling components
4. inspect related query/action files
5. inspect RBAC or schema only if the task requires it

## Prompt template for Codex

Use prompts in this structure:

### Goal
What should be built, changed, fixed, or explained.

### Context
Point Codex only to the relevant files and folders.
Prefer `@path` references in the prompt.

### Constraints
State what must remain unchanged:
- architecture
- API shape
- auth behavior
- RBAC rules
- UI patterns
- schema boundaries

### Done when
State what must be true at the end:
- build passes
- route works
- permission checks are correct
- cache invalidation is handled
- manual QA steps are listed

## Recommended prompt example

```text
Goal:
Add candidate note editing.

Context:
Reuse patterns from @components/notes, @app/(dashboard)/notes/actions.ts, @lib/db/queries/notes.ts, and the candidate detail page.

Constraints:
Keep App Router + server actions architecture.
Do not introduce client-side data fetching.
Reuse existing dialog/form styling.
Preserve current RBAC behavior.

Done when:
The note can be edited from the candidate detail view, related caches are revalidated, pnpm build passes, and manual QA steps are listed.
```

## Token-saving rules

To reduce AI usage and context cost:

- mention exact files instead of asking for repo-wide analysis
- prefer one coherent task per chat
- reuse the same chat only for the same feature thread
- create a new chat for a different feature
- ask for a plan first only when the task is genuinely complex
- ask for patch-list before implementation when the feature touches auth, RBAC, or DB schema
- do not ask for “analyze my whole repository” unless you really need it

## File reading priorities

### For UI work
Read in this order:
1. target route page
2. related feature components
3. sibling feature for pattern reuse
4. action/query files only if data flow is unclear

### For CRUD work
Read in this order:
1. feature route
2. feature `actions.ts`
3. feature query file
4. schema for the touched table(s)
5. cache tags
6. RBAC only if mutation/read access changes

### For auth or onboarding work
Read in this order:
1. `app/(login)/actions.ts`
2. `lib/auth/session.ts`
3. `lib/auth/middleware.ts`
4. `lib/db/queries.ts`
5. schema tables for users/teams/memberships/invitations
6. related team pages if needed

### For permission issues
Read in this order:
1. route/page guard
2. action guard
3. `lib/rbac/*`
4. sidebar visibility if navigation mismatch exists

## Definition of done

A task is not complete until it includes:

- changed file list
- short explanation of what changed
- relevant validation command results
- risks or follow-ups
- manual QA steps for UI/auth/RBAC-sensitive changes

## Validation preference

Run the smallest relevant check first.

Preferred order:
1. targeted reasoning check
2. `pnpm lint`
3. `pnpm build`

Use DB commands only when the task requires schema work.

## When to propose docs updates

Suggest doc updates when:
- a new architectural rule appears
- a new domain concept is introduced
- a migration caveat is discovered
- a permission rule changes
- a repeated implementation pattern becomes stable