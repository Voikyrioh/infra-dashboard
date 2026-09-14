# Vue components

Dashboard UI component library organized by atomic design hierarchy.

## Atoms (primitive, reusable elements)

Base building blocks: buttons, inputs, icons, badges.

| Component | Props | Emits | Use |
|---|---|---|---|
| [AppButton](./AppButton.md) | `variant`, `size`, `disabled`, `loading` | `click` | CTA button with loading state |
| [AppInput](./AppInput.md) | `type`, `placeholder`, `value`, `error` | `update:modelValue`, `focus` | Text input with validation |
| [AppToast](./AppToast.md) | `message`, `type`, `duration` | `close` | Alert notification |
| [GaugeCircle](./GaugeCircle.md) | `percent`, `label`, `color` | — | Circular progress indicator |
| [LineChart](./LineChart.md) | `data`, `label`, `options` | — | Time-series chart (Chart.js) |
| [TagPill](./TagPill.md) | `label`, `color`, `removable` | `remove` | Label badge |
| [VersionSelect](./VersionSelect.md) | `modelValue`, `options` | `update:modelValue` | Dropdown for version selection |

## Molecules (compound components)

Combination of atoms and domain logic.

| Component | Use |
|---|---|
| [AuthCard](./AuthCard.md) | Login form container (Passkey entry) |
| [AppRow](./AppRow.md) | Table row (app name, status, tags) |
| [AppSidebar](./AppSidebar.md) | Navigation sidebar with app list |
| [AppConfigModal](./AppConfigModal.md) | Modal for app config/env vars |
| [MetricCard](./MetricCard.md) | Card displaying single metric (CPU, RAM) |
| [VisitsPanel](./VisitsPanel.md) | Analytics panel (pageviews, visitors) |

## Pages (routed views)

Full-screen layouts.

| Component | Route | Purpose |
|---|---|---|
| [LoginPage](./LoginPage.md) | `/` | WebAuthn registration/login |
| [DashboardPage](./DashboardPage.md) | `/dashboard` | Main app list and live metrics |
| [ApplicationsPage](./ApplicationsPage.md) | `/apps` | Detailed app registry |
| [AppDetailPage](./AppDetailPage.md) | `/apps/:id` | Single app detail (logs, config, history) |

## Design tokens

Color palette (CSS variables):
- Dark: `#0a0e17`, `#10161e`
- Accent: `#10b981` (emerald)
- Error: `#ef4444` (red)
- Text: `#e5e7eb` (light gray)

Typography:
- Display: JetBrains Mono 14px
- Body: Outfit 14px
- Mono: JetBrains Mono 12px
