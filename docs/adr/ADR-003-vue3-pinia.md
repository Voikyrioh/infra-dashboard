# ADR-003: Vue 3 + Pinia for frontend state

**Status:** acceptée

**Context:** Dashboard UI is simple SPA: login screen, metric dashboard, app list/detail. State: auth token, app list, selected metrics. Pinia replaces Vuex for modern composition-based state.

**Decision:** Vue 3 + Vite (build) + Vue Router (routing) + Pinia (state). No other UI frameworks.

**Consequences:**
- (+) Type-safe reactive state (Pinia composable stores)
- (+) Zero-config dev server (Vite ~100ms rebuild)
- (+) Small bundle (<200KB gzipped with deps)
- (-) Manual theming (no Shadcn/Material library)
- (-) No pre-built form validation (use Zod schema)

**Implementation:**
- Pinia auth store for token + session state
- Vue Router 5 with middleware guards (requireAuth)
- Tailwind CSS + CSS variables for theming
- Composition API components with `<script setup>`

**Related:** orga-global ADR-0001 (modern Vue stack)
