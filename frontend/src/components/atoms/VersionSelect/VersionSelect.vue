<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  versions: string[]
  deployedVersion: string | null
  disabled: boolean
}>()

const emit = defineEmits<{ deploy: [version: string] }>()

const selected = ref(props.deployedVersion ?? props.versions[0] ?? '')
const query = ref('')
const isOpen = ref(false)

const isRollback = computed(
  () => !!props.deployedVersion && selected.value !== props.deployedVersion,
)

const filtered = computed(() =>
  props.versions.filter((v) => v.includes(query.value)),
)

function openDropdown() {
  if (props.disabled) return
  isOpen.value = true
  query.value = ''
}

function selectVersion(v: string) {
  selected.value = v
  query.value = ''
  isOpen.value = false
}

function handleInputChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  query.value = val
  selected.value = val
  isOpen.value = true
}

function handleDeploy() {
  if (props.disabled || !selected.value) return
  emit('deploy', selected.value)
}
</script>

<template>
  <div class="relative inline-flex">
    <div
      class="inline-flex rounded-md overflow-visible"
      :class="isRollback
        ? 'border border-amber-700'
        : disabled ? 'border border-slate-700' : 'border border-green-800'"
      :style="isRollback ? 'background:#1c0f00' : disabled ? 'background:#0f172a' : 'background:#0d1f12'"
    >
      <div
        class="flex items-center gap-1 px-2 border-r"
        :class="isRollback ? 'border-amber-700' : disabled ? 'border-slate-700' : 'border-green-800'"
        style="min-width:108px"
      >
        <input
          :value="selected"
          :disabled="disabled"
          :placeholder="disabled ? 'aucune version' : 'v0.0.0'"
          class="bg-transparent border-none outline-none text-xs font-mono w-16"
          :class="isRollback ? 'text-orange-400' : disabled ? 'text-slate-600 italic' : 'text-green-400'"
          style="cursor:pointer"
          @click="openDropdown"
          @input="handleInputChange"
        />
        <span
          class="text-xs cursor-pointer select-none"
          :class="isRollback ? 'text-amber-700' : 'text-green-800'"
          @click="isOpen = !isOpen"
        >▾</span>
      </div>

      <button
        :disabled="disabled"
        class="text-xs font-semibold px-3 py-1 border-none whitespace-nowrap"
        :class="isRollback
          ? 'bg-red-950 text-orange-400 cursor-pointer'
          : disabled ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
          : 'bg-green-950 text-green-400 cursor-pointer'"
        @click="handleDeploy"
      >
        {{ isRollback ? '↓ Rollback' : '↑ Déployer' }}
      </button>
    </div>

    <div
      v-if="isOpen && !disabled"
      class="absolute right-0 z-20 mt-1 min-w-36 rounded-md overflow-hidden shadow-xl"
      style="top:100%;background:#0d1f12;border:1px solid #166534"
    >
      <div
        v-for="v in filtered"
        :key="v"
        data-testid="version-option"
        class="px-3 py-1.5 text-xs font-mono cursor-pointer flex justify-between items-center"
        :class="v === deployedVersion ? 'text-green-400' : 'text-slate-200'"
        :style="v === deployedVersion ? 'background:#1a3a1a' : ''"
        @click="selectVersion(v)"
      >
        {{ v }}
        <span v-if="v === deployedVersion" class="text-green-800 text-xs">déployée</span>
      </div>
      <div v-if="filtered.length === 0" class="px-3 py-2 text-xs text-slate-500 italic">
        Aucun résultat
      </div>
    </div>
  </div>
</template>
