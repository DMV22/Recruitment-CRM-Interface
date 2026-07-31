# AGENTS.md

## Project overview

This repository is a recruitment CRM built on top of a Next.js starter.
The original SaaS boilerplate was adapted into a team-based CRM for clients, vacancies, candidates, submissions, notes, dashboard metrics, team management, and activity history.

The main goal when making changes is to extend the CRM domain cleanly without reintroducing boilerplate SaaS assumptions that no longer match the product.

## Tech stack

- Next.js App Router
- TypeScript
- React 19
- Tailwind CSS 4
- shadcn/ui-style component primitives in `components/ui`
- Drizzle ORM
- PostgreSQL / Supabase
- Custom cookie session auth via `jose`
- Server Actions for mutations
- RBAC based on `users.crmRole`

## Core architecture

Use the existing architecture. Do not introduce a new app structure unless explicitly requested.

Main layers:

1. Route pages in `app/**`
2. Query layer in `lib/db/queries/**`
3. Mutation layer in `app/**/actions.ts` or feature-local action files
4. Reusable UI components in `components/**`
5. Authorization helpers in `lib/rbac/**`
6. Shared helpers in `lib/**`

Preferred flow for new features:

- page loads data through query functions
- actions mutate data on the server
- actions revalidate relevant cache tags
- UI components stay relatively focused and presentational
- permission checks happen explicitly, not implicitly

## Repository map

### App routes
- `app/(login)` — auth pages and auth actions
- `app/(dashboard)` — protected CRM area
- `app/api` — lightweight API routes for session/team/user cases

### Main feature areas
- `app/(dashboard)/clients`
- `app/(dashboard)/vacancies`
- `app/(dashboard)/candidates`
- `app/(dashboard)/submissions`
- `app/(dashboard)/notes`
- `app/(dashboard)/team`
- `app/(dashboard)/dashboard`

### Important libraries
- `lib/db/schema.ts` — database schema
- `lib/db/queries.ts` — shared user/session/team lookup helpers
- `lib/db/queries/*` — feature-specific read queries
- `lib/rbac/*` — roles, permissions, guards
- `lib/cache-tags.ts` — cache tag naming
- `lib/activity/log-activity.ts` — centralized activity logging helper
- `lib/auth/session.ts` — session cookie and JWT logic
- `lib/auth/middleware.ts` — validated action wrappers

## Coding rules

- Reuse existing patterns before creating new abstractions.
- Keep changes minimal and local when possible.
- Prefer feature-local components and queries over large shared abstractions unless reuse is obvious.
- Keep route files thin; move non-trivial logic into query/helpers/components.
- Do not add client-side fetching for data that is already handled well with server rendering and server actions.
- Do not move business logic into UI components unless the current codebase already follows that pattern in the same area.
- Avoid introducing new dependencies unless necessary.

## RBAC rules

RBAC is a first-class part of the app.

- CRM permissions are based on `users.crmRole`
- Do not rely only on hidden navigation items for access control
- Always enforce permissions in pages and server actions
- Reuse existing helpers from `lib/rbac`
- If a page is visible in the sidebar, verify the route is also guarded
- If an action changes data, check permissions server-side before mutating

Important roles currently include:
- `admin`
- `recruiter`
- `hiring_manager`
- `viewer`

Source files:
- `lib/rbac/roles.ts`
- `lib/rbac/permissions.ts`
- `lib/rbac/index.ts`
- `lib/rbac/guards.ts`
- `lib/rbac/action-guard.ts`

## Data and cache rules

Use existing query and cache patterns.

- Read logic belongs in `lib/db/queries/*`
- Mutations belong in server actions
- Reuse `cacheTags` from `lib/cache-tags.ts`
- After create/update/delete, revalidate all affected list/detail tags
- Prefer explicit cache invalidation over broad invalidation

When adding a new entity or relationship:
- define or update cache tags
- update affected queries
- update dependent dashboard/activity views if needed

## Database rules

- Database schema source of truth: `lib/db/schema.ts`
- Migrations live in `lib/db/migrations`
- Use Drizzle conventions already present in the project
- Be careful with migration history because this repo evolved from a starter and may already have baseline assumptions
- Do not rewrite old migrations unless explicitly requested
- Prefer additive schema changes
- If a schema change affects auth, team membership, invitations, or submissions, document the impact in your final notes

## Auth rules

- Auth is custom, cookie-based, and server-driven
- Session logic lives in `lib/auth/session.ts`
- Signup/signin flows live in `app/(login)/actions.ts`
- Team creation and invitation acceptance are coupled to auth onboarding
- Be careful when changing signup logic because it can affect `users`, `teams`, `teamMembers`, `invitations`, and activity logs

## UI rules

- Reuse existing UI primitives from `components/ui`
- Match the current dashboard styling and spacing
- Keep forms consistent with existing form components
- Avoid introducing a parallel design system
- Prefer accessible server-first UI patterns
- For tables, badges, dialogs, and forms, follow the existing feature modules first

## Validation commands

Use the smallest relevant validation first, then broader validation if needed.

Primary commands:
- `pnpm build`
- `pnpm lint`

Useful DB commands:
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:studio`

Do not run destructive DB changes unless explicitly requested.

## What a good task result looks like

A completed change should usually include:

1. Minimal set of edited files
2. Consistent use of existing patterns
3. Correct permission handling
4. Correct cache invalidation
5. Notes about affected flows or edge cases
6. Validation summary with commands run
7. Manual QA steps for important UI or auth flows

## Prompt efficiency rules

To reduce token and analysis cost in this repository:

- Read only files directly related to the requested feature
- Start from the nearest route, action file, query file, and component folder
- Reuse existing patterns from sibling features before searching the entire repo
- Avoid broad repo-wide scans unless the task is architectural
- Summarize findings briefly instead of repeating file contents
- When a pattern is already established, apply it consistently rather than re-evaluating alternatives

## Default task workflow

For most feature requests:

1. identify the target route or feature area
2. inspect sibling feature patterns
3. inspect related query and action files
4. inspect RBAC and cache tags only if the feature touches permissions or data mutation
5. implement the smallest coherent patch
6. run relevant validation
7. report changed files, risks, and QA steps

## When to stop and ask

Stop and ask before proceeding if:

- the request implies a schema change with unclear migration impact
- the feature crosses multiple bounded areas with conflicting patterns
- the permission model is ambiguous
- there are two valid architectural directions and the repo does not clearly prefer one
- the change could affect onboarding, auth, or team membership flows in a breaking way