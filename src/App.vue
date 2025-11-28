<script setup lang="ts">
import { onMounted } from 'vue';
import Controls from './components/Controls.vue';
import { useAppStore } from './stores/appStore';

const appStore = useAppStore();

onMounted(async () => await appStore.initialize());
</script>

<template>
  <Controls />
</template>

<style scoped>
</style>
