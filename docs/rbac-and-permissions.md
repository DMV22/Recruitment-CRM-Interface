# RBAC and Permissions

## Source of truth

CRM access is controlled by `users.crmRole`.

Do not treat team membership role alone as sufficient for CRM permissions.
Navigation visibility is not security.

## Roles

Current CRM roles:
- `admin`
- `recruiter`
- `hiring_manager`
- `viewer`

Definitions live in:
- `lib/rbac/roles.ts`
- `lib/rbac/permissions.ts`

## Current permission model

Permissions include:
- dashboard access
- CRUD access for clients, vacancies, candidates
- read/create/update access for submissions
- pipeline read/update
- notes read/create/delete
- activity read
- team read/manage
- roles manage
- settings read/manage

Always reuse permission constants and helpers already defined in the repo.

## Enforcement rules

Every protected feature should be checked at the correct layer:

### Route/page level
Use permission checks before rendering the page.

### Action level
Check permissions before performing writes or privileged operations.

### Query level
If data visibility differs by role, scope queries accordingly.
Example: a hiring manager may see only their own vacancies or related records.

## Common mistakes to avoid

- showing a sidebar item without route access
- protecting a page but forgetting the server action
- relying on hidden buttons instead of server-side checks
- forgetting scoped reads for `hiring_manager`
- allowing role changes without guardrails
- letting users remove or demote themselves without explicit policy
- forgetting to revalidate dependent screens after a role change

## Feature checklist

When a task touches permissions, verify:

1. Is the page protected?
2. Is the mutation protected?
3. Does the query need role-aware filtering?
4. Does the sidebar reflect visibility correctly?
5. Do empty/error states still make sense for lower-permission roles?
6. Are cache tags revalidated after permission-sensitive mutations?

## Suggested QA scenarios

### Admin
- full access to all main CRM areas
- can manage team and roles

### Recruiter
- can work with most CRM entities
- cannot manage team roles unless explicitly allowed

### Hiring manager
- should be tested for scoped visibility and limited mutation rules

### Viewer
- should be able to read only the allowed areas
- should not be able to mutate data through direct action calls