# GaugeCircle

Circular progress indicator with percentage label (metrics display).

**Location:** `frontend/src/components/atoms/GaugeCircle/GaugeCircle.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `percent` | `number` (0-100) | `0` | Fill percentage |
| `label` | `string` | `""` | Label text (e.g., "CPU") |
| `color` | `string (hex)` | `"#10b981"` | SVG stroke color |

## Slots

- None

## Emits

- None (read-only display component)

## Example

```vue
<GaugeCircle :percent="75" label="Memory" color="#ef4444" />
```

## Style

- SVG circle with animated stroke-dasharray
- Center label and percent text
- Responsive: scales to container width
