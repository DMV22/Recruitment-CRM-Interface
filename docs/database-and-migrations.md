# Database and Migrations

## Current stack

- PostgreSQL
- Supabase-hosted database
- Drizzle ORM
- schema in `lib/db/schema.ts`
- migrations in `lib/db/migrations`

## Source of truth

For application structure, the schema file is the main source of truth.
For already deployed environments, migration history must also be considered.

## Important caution

This repository evolved from a starter and already has baseline migration history.
Do not assume old migrations can always be replayed safely against an existing non-empty database.

When modifying the schema:
- prefer additive changes
- avoid rewriting older migrations
- be careful with existing enum types, constraints, and indexes
- confirm whether the target DB is clean or already provisioned

## Required workflow for schema changes

1. update `lib/db/schema.ts`
2. generate migration
3. inspect generated SQL manually
4. verify naming, constraints, indexes, and defaults
5. test against the appropriate environment
6. document follow-up risks if production/dev DBs may differ

## Auth-sensitive tables

Be especially careful with:
- `users`
- `teams`
- `teamMembers`
- `invitations`

These tables affect:
- signup
- invite acceptance
- team access
- CRM role assignment
- session-related flows

## CRM-sensitive tables

Also be careful with:
- `clients`
- `vacancies`
- `candidates`
- `submissions`
- `notes`
- `activityLogs`

Changes here often affect:
- dashboards
- counts and KPI queries
- activity timelines
- detail pages
- cache invalidation

## Migration review checklist

Before accepting a migration, check:

- does it preserve existing data?
- does it introduce the correct defaults?
- does it create duplicate types or indexes?
- does it conflict with the current Supabase state?
- does it require data backfill?
- does it require updates to seed/setup scripts?

## AI-specific rule

When using Codex for DB work:
- ask for a patch-list first
- require explicit explanation of migration impact
- require a list of affected queries/actions/pages
- do not allow “silent” schema changes without review