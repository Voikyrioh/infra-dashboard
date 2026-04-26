<script setup lang="ts">
defineProps<{
	title?: string;
	subtitle?: string;
}>();
</script>

<template>
	<div class="auth-card glass-card animate-fade-up">
		<div v-if="title || subtitle" class="auth-card__header">
			<div class="auth-card__icon">
				<slot name="icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
					</svg>
				</slot>
			</div>
			<h1 v-if="title" class="auth-card__title font-display">{{ title }}</h1>
			<p v-if="subtitle" class="auth-card__subtitle">{{ subtitle }}</p>
		</div>
		<div class="auth-card__body">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.auth-card {
	width: 100%;
	max-width: 420px;
	padding: 0;
	overflow: hidden;
}

.auth-card__header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding: 36px 32px 24px;
	border-bottom: 1px solid var(--color-border);
}

.auth-card__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 48px;
	height: 48px;
	border-radius: var(--radius-md);
	background: var(--color-emerald-dim);
	border: 1px solid var(--color-border-accent);
	color: var(--color-emerald);
	animation: pulse-neon 3s ease-in-out infinite;
}

.auth-card__title {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 600;
	letter-spacing: -0.01em;
	color: var(--color-text-primary);
	text-align: center;
}

.auth-card__subtitle {
	margin: 0;
	font-size: 0.85rem;
	color: var(--color-text-secondary);
	text-align: center;
	line-height: 1.5;
	max-width: 300px;
}

.auth-card__body {
	padding: 28px 32px 32px;
}
</style>
