# ApplicationsPage

Detailed applications registry page (full app list with sync/add controls).

**Location:** `frontend/src/components/pages/ApplicationsPage/ApplicationsPage.vue`

## Route

- Path: `/apps`
- When: User clicks "Applications" in sidebar

## Layout

- Header: "Applications Registry"
- Toolbar: "Sync from GitHub" button, "Add App" button
- App list table (AppRow components)
- Pagination (if >50 apps)

## Data flow

1. Fetch `GET /apps/` (all applications)
2. On "Sync": `POST /apps/sync`, show progress toast
3. On "Add": open modal, `POST /apps/` with form data
4. On row click: navigate to `/apps/:id`

## Related

ADR-003 (app registry), BR-APPS-002 (version immutability), open-api/apps.md
