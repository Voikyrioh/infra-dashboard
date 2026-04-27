<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: number;
  label: string;
  sublabel?: string;
}>();

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const strokeDashoffset = computed(
  () => CIRCUMFERENCE * (1 - Math.min(props.value, 100) / 100),
);

const color = computed(() => {
  if (props.value >= 90) return "var(--color-error)";
  if (props.value >= 70) return "var(--color-amber)";
  return "var(--color-emerald)";
});
</script>

<template>
  <div class="gauge">
    <svg class="gauge__svg" viewBox="0 0 100 100" width="96" height="96">
      <circle
        class="gauge__track"
        cx="50" cy="50"
        :r="RADIUS"
        fill="none"
        stroke="var(--color-bg-tertiary)"
        stroke-width="8"
      />
      <circle
        class="gauge__arc"
        cx="50" cy="50"
        :r="RADIUS"
        fill="none"
        :stroke="color"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="strokeDashoffset"
        transform="rotate(-90 50 50)"
      />
      <text
        x="50" y="46"
        text-anchor="middle"
        class="gauge__value font-display"
        :fill="color"
      >{{ value }}%</text>
      <text
        x="50" y="60"
        text-anchor="middle"
        class="gauge__label"
        fill="var(--color-text-muted)"
      >{{ label }}</text>
    </svg>
    <p v-if="sublabel" class="gauge__sublabel">{{ sublabel }}</p>
  </div>
</template>

<style scoped>
.gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.gauge__arc {
  transition: stroke-dashoffset 0.6s ease, stroke 0.3s ease;
}

.gauge__value {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-display);
}

.gauge__label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.gauge__sublabel {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin: 0;
}
</style>
