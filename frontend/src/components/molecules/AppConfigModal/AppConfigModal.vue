<script setup lang="ts">
import { ref, watch } from "vue";
import TagPill from "@/components/atoms/TagPill/TagPill.vue";
import type { App, PredefinedTag, ConfigureAppPayload } from "@/services/apps.service";

const props = defineProps<{
  app: App;
  tags: PredefinedTag[];
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [payload: ConfigureAppPayload];
  "add-tag": [data: { category: string; label: string; color: string }];
}>();

const displayName = ref(props.app.displayName ?? "");
const type = ref<"frontend" | "backend" | "fullstack" | null>(props.app.type);
const containerName = ref(props.app.containerName ?? "");
const selectedTagIds = ref<string[]>(props.app.tags.map((t) => t.id));
const showNewTagForm = ref(false);
const newTagLabel = ref("");
const newTagColor = ref("#6366f1");

watch(
  () => props.app,
  (app) => {
    displayName.value = app.displayName ?? "";
    type.value = app.type;
    containerName.value = app.containerName ?? "";
    selectedTagIds.value = app.tags.map((t) => t.id);
  },
);

function toggleTag(tagId: string) {
  const idx = selectedTagIds.value.indexOf(tagId);
  if (idx === -1) selectedTagIds.value.push(tagId);
  else selectedTagIds.value.splice(idx, 1);
}

function cancel() {
  emit("update:modelValue", false);
}

function save() {
  if (!type.value) return;
  emit("submit", {
    displayName: displayName.value,
    type: type.value,
    containerName: containerName.value,
    tagIds: selectedTagIds.value,
  });
  emit("update:modelValue", false);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="cancel">
      <div class="modal">
        <div class="modal__header">
          <div>
            <div class="modal__title">Configurer l'application</div>
            <div class="modal__repo">{{ app.repoUrl.replace("https://github.com/", "") }}</div>
          </div>
          <button class="modal__close" @click="cancel">✕</button>
        </div>

        <div class="modal__body">
          <label class="modal__label">Nom affiché</label>
          <input
            v-model="displayName"
            class="modal__input"
            data-testid="input-name"
            placeholder="ex: Mon Application"
          />

          <label class="modal__label">Type</label>
          <div class="modal__type-group">
            <button
              v-for="t in ['frontend', 'backend', 'fullstack']"
              :key="t"
              class="modal__type-btn"
              :class="{ 'modal__type-btn--active': type === t }"
              :data-testid="`type-${t}`"
              @click="type = t as 'frontend' | 'backend' | 'fullstack'"
            >
              {{ t.charAt(0).toUpperCase() + t.slice(1) }}
            </button>
          </div>

          <label class="modal__label">Nom du container Docker</label>
          <input
            v-model="containerName"
            class="modal__input"
            data-testid="input-container"
            placeholder="ex: my-app"
          />

          <label class="modal__label">Tags</label>
          <div class="modal__tags">
            <TagPill
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.label"
              :color="tag.color"
              :selectable="true"
              :selected="selectedTagIds.includes(tag.id)"
              @toggle="toggleTag(tag.id)"
            />
            <button class="modal__new-tag-btn" @click="showNewTagForm = !showNewTagForm">
              + Nouveau tag
            </button>
          </div>

          <div v-if="showNewTagForm" class="modal__new-tag-form">
            <input v-model="newTagLabel" class="modal__input" placeholder="Nom du tag" />
            <input v-model="newTagColor" type="color" class="modal__color-input" />
            <button
              class="modal__add-btn"
              @click="$emit('add-tag', { category: 'database', label: newTagLabel, color: newTagColor }); showNewTagForm = false; newTagLabel = ''"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div class="modal__footer">
          <button class="modal__btn modal__btn--cancel" data-testid="cancel" @click="cancel">
            Annuler
          </button>
          <button class="modal__btn modal__btn--save" data-testid="save" @click="save">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  z-index: 50;
}
.modal {
  background: #1e293b;
  border: 1px solid rgba(52, 211, 153, 0.25);
  border-radius: 14px;
  width: 460px;
  padding: 28px;
  box-shadow: 0 0 40px rgba(52, 211, 153, 0.1);
}
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.modal__title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
}
.modal__repo {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--font-display);
  margin-top: 3px;
}
.modal__close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  font-size: 18px;
}
.modal__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.modal__label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: -10px;
}
.modal__input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #f1f5f9;
  font-family: var(--font-display);
  width: 100%;
  box-sizing: border-box;
  outline: none;
}
.modal__input:focus {
  border-color: rgba(52, 211, 153, 0.4);
}
.modal__type-group {
  display: flex;
  gap: 8px;
}
.modal__type-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  transition: all 0.15s;
}
.modal__type-btn--active {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.4);
  color: #34d399;
  font-weight: 600;
}
.modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.modal__new-tag-btn {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 4px 10px;
  cursor: pointer;
}
.modal__new-tag-form {
  display: flex;
  gap: 8px;
  align-items: center;
}
.modal__color-input {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
}
.modal__add-btn {
  background: rgba(52, 211, 153, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}
.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}
.modal__btn {
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}
.modal__btn--cancel {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
}
.modal__btn--save {
  background: rgba(52, 211, 153, 0.2);
  border: 1px solid rgba(52, 211, 153, 0.5);
  color: #34d399;
  font-weight: 600;
}
</style>
