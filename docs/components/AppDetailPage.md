# AppDetailPage

Detailed app view (configuration, logs, version history, metrics).

**Location:** `frontend/src/components/pages/AppDetailPage/AppDetailPage.vue`

## Route

- Path: `/apps/:id`
- When: User clicks app in list

## Layout

- Header: app name + status badge
- Tabs: Overview, Config, Logs, Metrics, Deployment History
- Tab content:
  - **Overview**: MetricCard grid (live CPU, RAM, network)
  - **Config**: AppConfigModal content (env vars, labels, volumes)
  - **Logs**: Live container log stream (last 100 lines, refresh button)
  - **Metrics**: LineChart with 24h history (CPU, memory trends)
  - **History**: Version list with VersionSelect, rollback button

## Data flow

1. Fetch `GET /apps/:id` (app details)
2. Fetch `GET /apps/:id/stats` (live metrics)
3. Fetch `GET /apps/:id/infra-config` (configuration)
4. Fetch `GET /apps/:id/logs` (container logs, stream)
5. Fetch `GET /apps/:id/metrics/history` (historical data for chart)
6. Fetch `GET /apps/:id/versions` (version list)

## Related

open-api/apps.md, BR-APPS-003 (read-only metrics)
