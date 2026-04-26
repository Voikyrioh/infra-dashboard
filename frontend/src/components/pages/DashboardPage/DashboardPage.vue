<script setup lang="ts">
</script>

<template>
	<div class="dashboard-page">
		<div class="dashboard-page__content animate-fade-up">
			<div class="dashboard-page__badge font-display">
				<span class="dashboard-page__badge-dot" />
				Connecté
			</div>
			<h1 class="dashboard-page__title font-display">
				Infrastructure
				<span class="neon-text-emerald">Dashboard</span>
			</h1>
			<p class="dashboard-page__subtitle">
				Bienvenue. Les fonctionnalités de déploiement arrivent bientôt.
			</p>
		</div>
	</div>
</template>

<style scoped>
.dashboard-page {
	min-height: calc(100vh - 56px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 48px 24px;
	position: relative;
	z-index: 1;
}

.dashboard-page__content {
	text-align: center;
	max-width: 560px;
}

.dashboard-page__badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 6px 14px;
	border-radius: 999px;
	background: var(--color-emerald-dim);
	border: 1px solid var(--color-border-accent);
	color: var(--color-emerald);
	font-size: 0.75rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	margin-bottom: 24px;
}

.dashboard-page__badge-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--color-emerald);
	animation: pulse-neon 2s ease-in-out infinite;
}

.dashboard-page__title {
	font-size: clamp(2rem, 5vw, 3rem);
	font-weight: 700;
	letter-spacing: -0.03em;
	line-height: 1.1;
	color: var(--color-text-primary);
	margin: 0 0 16px;
}

.dashboard-page__subtitle {
	font-size: 1rem;
	color: var(--color-text-secondary);
	line-height: 1.6;
	margin: 0;
}
</style>
