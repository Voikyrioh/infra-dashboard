<script setup lang="ts">
import "@/assets/style/main.css";
import AppHeader from "@/components/molecules/AppHeader/AppHeader.vue";
</script>

<template>
	<div class="gradient-bg" style="min-height: 100vh">
		<AppHeader />
		<main style="position: relative; z-index: 1">
			<RouterView />
		</main>
	</div>
</template>
