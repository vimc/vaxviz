<script setup lang="ts">
import Controls from './components/Controls.vue';
import { useAppStore } from './stores/appStore';

const appStore = useAppStore();
</script>

<template>
  <div v-if="appStore.initialized">
    <Controls />
  </div>
</template>

<style scoped>
</style>
