# frontend — Architecture

## Vue 3 SPA layout

Single-page application (Vite dev server + production build). Vue Router handles navigation: `/` (login), `/dashboard` (main view), `/apps/:id` (detail page). Tailwind CSS 4 for styling with custom design tokens (emerald/navy/dark theme).

Component hierarchy: `/atoms` (button, input, toast, chart primitives), `/molecules` (cards, forms, sidebars), `/pages` (routed views). Pinia stores manage auth state globally. Services layer abstracts API calls.

## State management

Pinia `authStore`: token cookie status, user session state, login/logout actions. Reactive computed properties drive template rendering. No client-side caching of backend data — all fetches hit the API.

## Styling and theming

CSS variables in `assets/style/` for dark/light mode. Tailwind config extends with custom colors. Theme toggle persists to localStorage. All components receive theme state via CSS custom properties, no inline styles.
