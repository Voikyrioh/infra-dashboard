<script setup lang="ts">
const props = defineProps<{
  label: string;
  color: string;
  selectable?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{ toggle: [] }>();

function handleClick() {
  if (props.selectable) emit("toggle");
}
</script>

<template>
  <span
    class="tag-pill"
    :class="{ 'tag-pill--selected': props.selected, 'tag-pill--selectable': props.selectable }"
    :style="{ '--tag-color': props.color }"
    @click="handleClick"
  >
    {{ props.label }}
  </span>
</template>

<style scoped>
.tag-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-family: var(--font-display);
  background: color-mix(in srgb, var(--tag-color) 20%, transparent);
  color: color-mix(in srgb, var(--tag-color) 80%, white);
  border: 1px solid color-mix(in srgb, var(--tag-color) 35%, transparent);
  transition: opacity 0.15s;
}
.tag-pill--selectable {
  cursor: pointer;
}
.tag-pill--selectable:not(.tag-pill--selected) {
  opacity: 0.4;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.12);
}
.tag-pill--selectable:hover {
  opacity: 1;
}
</style>
