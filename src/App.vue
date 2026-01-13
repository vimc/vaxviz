<script setup lang="ts">
import PlotControls from './components/PlotControls.vue';
import RidgelinePlot from './components/RidgelinePlot.vue';
import DownloadButton from './components/DownloadButton.vue';
</script>

<template>
  <div class="flex h-screen">
    <PlotControls class="self-center"/>
    <div class="flex flex-col flex-1">
      <RidgelinePlot />
      <div class="p-4">
        <DownloadButton />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
