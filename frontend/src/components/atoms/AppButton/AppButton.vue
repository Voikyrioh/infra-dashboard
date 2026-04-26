<script setup lang="ts">
defineProps<{
	variant?: "primary" | "secondary" | "ghost";
	loading?: boolean;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
}>();
</script>

<template>
	<button
		:type="type ?? 'button'"
		:disabled="disabled || loading"
		:class="[
			'app-btn',
			`app-btn--${variant ?? 'primary'}`,
			{ 'app-btn--loading': loading },
		]"
	>
		<span v-if="loading" class="app-btn__spinner" aria-hidden="true" />
		<span class="app-btn__content" :class="{ 'opacity-0': loading }">
			<slot />
		</span>
	</button>
</template>

<style scoped>
.app-btn {
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 10px 20px;
	border-radius: var(--radius-md);
	font-family: var(--font-body);
	font-size: 0.9rem;
	font-weight: 500;
	letter-spacing: 0.01em;
	cursor: pointer;
	border: 1px solid transparent;
	transition:
		background-color var(--transition-fast),
		box-shadow var(--transition-fast),
		border-color var(--transition-fast),
		transform var(--transition-fast),
		opacity var(--transition-fast);
	white-space: nowrap;
	user-select: none;
}

.app-btn:disabled {
	opacity: 0.45;
	cursor: not-allowed;
	transform: none !important;
	box-shadow: none !important;
}

/* Primary */
.app-btn--primary {
	background: var(--color-emerald);
	color: #000;
	border-color: var(--color-emerald);
}

.app-btn--primary:not(:disabled):hover {
	background: var(--color-emerald-light);
	border-color: var(--color-emerald-light);
	box-shadow: var(--shadow-neon-emerald);
	transform: translateY(-1px);
}

.app-btn--primary:not(:disabled):active {
	transform: translateY(0);
	box-shadow: none;
}

/* Secondary */
.app-btn--secondary {
	background: transparent;
	color: var(--color-emerald);
	border-color: var(--color-border-accent);
}

.app-btn--secondary:not(:disabled):hover {
	background: var(--color-emerald-dim);
	border-color: var(--color-emerald);
	box-shadow: var(--shadow-neon-emerald);
	transform: translateY(-1px);
}

/* Ghost */
.app-btn--ghost {
	background: transparent;
	color: var(--color-text-secondary);
	border-color: transparent;
}

.app-btn--ghost:not(:disabled):hover {
	background: var(--color-bg-tertiary);
	color: var(--color-text-primary);
}

/* Loading state */
.app-btn__content {
	display: flex;
	align-items: center;
	gap: 8px;
	transition: opacity var(--transition-fast);
}

.app-btn__spinner {
	position: absolute;
	width: 16px;
	height: 16px;
	border: 2px solid currentColor;
	border-top-color: transparent;
	border-radius: 50%;
	animation: spin-slow 0.7s linear infinite;
}
</style>
