# Architecture

## Purpose

This project is a recruitment CRM for team-based hiring workflows.
It manages clients, vacancies, candidates, submissions, notes, activity logs, and team/member permissions.

## Current app shape

The codebase started from a Next.js SaaS starter and was progressively adapted into a CRM.
Some older boilerplate concepts still exist, but CRM-specific flows and permissions are now the primary source of truth.

## Main route groups

### `app/(login)`
Authentication and onboarding area.

Important files:
- `app/(login)/actions.ts`
- `app/(login)/sign-in/page.tsx`
- `app/(login)/sign-up/page.tsx`

Responsibilities:
- sign in
- sign up
- session setup
- onboarding into a team
- invitation acceptance

### `app/(dashboard)`
Protected CRM area.

Feature sections:
- `clients`
- `vacancies`
- `candidates`
- `submissions`
- `notes`
- `team`
- `dashboard`

Responsibilities:
- server-rendered feature pages
- permission-guarded route access
- Suspense/loading states
- feature-local server actions

## Layering pattern

### Pages
Page files should stay thin and orchestrate:
- auth checks
- permission checks
- loading query data
- rendering the main feature component tree

### Queries
Read access should live in `lib/db/queries/*`.

Use query files for:
- filtered reads
- joins
- team scoping
- role-aware read logic
- dashboard aggregation

### Actions
Mutations should live in feature-local action files, usually `actions.ts`.

Use action files for:
- validation
- permission enforcement
- DB writes
- activity logging
- cache revalidation
- redirect/response shaping when needed

### Components
Reusable UI lives in `components/*`.

Patterns in the repo:
- feature-scoped components in folders like `components/clients`, `components/submissions`
- shared primitives in `components/ui`

## Cross-cutting systems

### Auth
Session auth is custom and cookie-based.
Main files:
- `lib/auth/session.ts`
- `lib/auth/middleware.ts`
- `lib/db/queries.ts`

### RBAC
CRM access is controlled by `users.crmRole`.

Main files:
- `lib/rbac/roles.ts`
- `lib/rbac/permissions.ts`
- `lib/rbac/index.ts`
- `lib/rbac/guards.ts`
- `lib/rbac/action-guard.ts`

### Activity logging
Important business events should be logged.

Main file:
- `lib/activity/log-activity.ts`

Common cases:
- auth actions
- team membership changes
- CRUD activity for CRM entities
- stage transitions

### Caching
The app uses explicit cache tags.

Main file:
- `lib/cache-tags.ts`

When a feature mutates data:
- revalidate list tags
- revalidate detail tags
- revalidate related entity tags if relationships are affected
- revalidate dashboard/activity when metrics or activity are affected

## Important domain relationships

High-level relationships:
- a user belongs to a team through `teamMembers`
- a team owns clients, vacancies, candidates, submissions, notes, and activity
- a vacancy belongs to a client
- a submission connects a candidate to a vacancy
- notes can be attached to CRM entities
- permissions may further restrict what a user can do inside their team scope

## Implementation guidance

When adding a new feature:
1. start from the nearest existing feature with similar behavior
2. copy the architectural pattern, not just the UI
3. keep reads in query files and writes in actions
4. protect both pages and actions
5. add cache invalidation intentionally
6. update docs if the new feature changes architecture assumptions