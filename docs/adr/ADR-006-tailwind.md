# ADR-006: Tailwind CSS 4 with design tokens

**Status:** acceptée

**Context:** Frontend requires consistent styling across dark/light themes. Alternatives: Bootstrap (bloated), Material Design (rigid), CSS-in-JS (runtime overhead), plain CSS (maintenance burden).

**Decision:** Tailwind CSS 4 with custom design tokens (CSS variables). Theme toggle via `data-theme` attribute on `<html>`.

**Consequences:**
- (+) Utility-first reduces custom CSS (80% of styles via class names)
- (+) CSS variables enable dark mode without runtime JS (prefers-color-scheme media query)
- (+) Tree-shaking removes unused utilities (final bundle ~50KB)
- (-) Tailwind class names verbose in HTML (mitigated: `@apply` for components)
- (-) Learning curve for developers unfamiliar with utility CSS

**Design tokens (CSS variables):**
- Colors: `--color-bg-dark: #0a0e17`, `--color-accent: #10b981`, `--color-error: #ef4444`
- Typography: `--font-display: JetBrains Mono`, `--font-body: Outfit`
- Spacing: Tailwind default scale (4px, 8px, 16px, …)

**Implementation:**
- `assets/style/colors.css` defines token values (light + dark)
- Tailwind config extends with custom colors
- Components use `bg-[var(--color-bg)]` for CSS variable binding
- Theme toggle: `document.documentElement.setAttribute('data-theme', 'dark')`

**Related:** orga-global ADR-0006 (design system governance)
