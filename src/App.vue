<script setup lang="ts">
import { onMounted } from 'vue';
import Controls from './components/Controls.vue';
import { useAppStore } from './stores/appStore';
import Plot from './components/Plot.vue';

const appStore = useAppStore();

onMounted(async () => await appStore.initialize());
</script>

<template>
  <Controls />
  <Plot />
</template>

<style scoped>
</style>
