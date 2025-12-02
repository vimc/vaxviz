<script setup lang="ts">
import Controls from './components/Controls.vue';
import { useAppStore } from './stores/appStore';

const appStore = useAppStore();
appStore.initialize();
</script>

<template>
  <Controls />
</template>

<style scoped>
</style>
