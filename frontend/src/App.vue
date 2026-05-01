<script setup lang="ts">
import "@/assets/style/main.css";
import AppSidebar from "@/components/molecules/AppSidebar/AppSidebar.vue";
</script>

<template>
  <div class="app-layout gradient-bg">
    <AppSidebar />
    <main class="app-layout__content">
      <RouterView />
    </main>
  </div>
</template>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-layout__content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}
</style>
