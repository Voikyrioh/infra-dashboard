# DashboardPage

Main dashboard page with live metrics overview and app list.

**Location:** `frontend/src/components/pages/DashboardPage/DashboardPage.vue`

## Route

- Path: `/dashboard`
- When: User authenticated (JWT cookie present)

## Layout

- Top header: title, logout button
- Sidebar (AppSidebar): app list with filters
- Main content: metric cards grid (CPU, Memory, Network) + app list table (AppRow)
- Footer: VisitsPanel (analytics)

## Data flow

1. Fetch `GET /apps/` (app list)
2. Poll `GET /metrics/live` every 5 seconds (live metrics)
3. Fetch `GET /visits/` on mount (analytics)
4. On logout: `DELETE /auth/`, redirect to `/`

## Related

open-api/apps.md, open-api/metrics.md, open-api/visits.md
