# LineChart

Time-series line chart (metrics history visualization via Chart.js).

**Location:** `frontend/src/components/atoms/LineChart/LineChart.vue`

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `{ labels: string[], datasets: { label, data, borderColor, backgroundColor } }` | `{}` | Chart.js data object |
| `label` | `string` | `""` | Chart title |
| `options` | `ChartOptions` | `{}` | Chart.js options (scales, plugins) |

## Example

```vue
<LineChart 
  :data="{ 
    labels: ['0:00', '1:00', '2:00'],
    datasets: [{ label: 'CPU', data: [30, 45, 25], borderColor: '#10b981' }]
  }"
  label="CPU Usage"
/>
```

## Style

- Responsive canvas element (100% width)
- Grid background with legend
- Tooltip on hover
