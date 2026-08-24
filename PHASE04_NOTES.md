# PHASE 04 — Login + Role Workspace

Project: **PEMUDA DUSUN 3 SIDODADI**

## Scope implemented

- Public entry to `/login`
- Role model: `superadmin`, `admin`, `humas`
- Protected routing per role
- Superadmin dashboard: control overview, approval queue preview, audit preview, role/scope preview
- Admin dashboard: activity overview, verification preview, Humas assignment preview
- Humas workspace: mobile-first, activity assignment switcher, per-activity permissions, target collection preview, cash-on-hand vs handed-over preview, personal history
- Logout and session restore for demo mode

## Important architecture rules preserved

- Humas access is scoped per activity, not global
- Permissions can differ per activity
- Cash held by Humas is shown separately from activity cash
- Transaction actions are NOT implemented yet; buttons are intentionally non-destructive previews
- Public and internal UI use the same design system but different information density

## Demo authentication only

Development mode automatically enables demo authentication.

Demo accounts:

- `superadmin / demo-super`
- `admin / demo-admin`
- `humas / demo-humas`

The demo session stores only a demo user identifier in `sessionStorage` and expires after 8 hours. Passwords are not persisted to browser storage.

**This is not production security.** Real authentication and authorization must be enforced by the backend/database in a later phase. Frontend route guards are only UX protection.

For production builds, demo auth remains disabled unless explicitly enabled with:

`VITE_ENABLE_DEMO_AUTH=true`

Do not enable that flag on a real public deployment.

## Not implemented in Phase 04

- Supabase/database
- Production auth/session tokens
- User CRUD
- Real permission persistence
- Real iuran transactions
- Real purchase/expense transactions
- Cash handover workflow
- Verification actions
- Audit log persistence
- RAB/activity workspace editing
- LPJ generation

Those belong to the next implementation phases.
