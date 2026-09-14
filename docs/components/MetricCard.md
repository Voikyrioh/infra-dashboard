# MetricCard

Card displaying a single metric with gauge or number (CPU, RAM, network).

**Location:** `frontend/src/components/molecules/MetricCard/MetricCard.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | `""` | Metric name (e.g., "CPU Usage") |
| `value` | `number` | `0` | Current value |
| `unit` | `string` | `"%"` | Value unit |
| `type` | `"gauge"` \| `"number"` | `"gauge"` | Display style |
| `threshold` | `number` | `80` | Warn threshold (gauge only) |

## Emits

- None (display only)

## Example

```vue
<MetricCard 
  title="Memory" 
  :value="65" 
  unit="%" 
  type="gauge"
  :threshold="75"
/>
```

## Style

- Rounded card with border
- GaugeCircle (if type="gauge") or large number text
- Threshold color change (red if > threshold)
