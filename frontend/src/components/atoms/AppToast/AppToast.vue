<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-family: var(--font-body);
  max-width: 360px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.toast--info {
  background: #0f2233;
  border: 1px solid #1e4a6e;
  color: #60a5fa;
}

.toast--success {
  background: #0d1f12;
  border: 1px solid #166534;
  color: #4ade80;
}

.toast--error {
  background: #1f0d0d;
  border: 1px solid #7f1d1d;
  color: #f87171;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
