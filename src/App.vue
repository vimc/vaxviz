<script setup lang="ts">
import PlotControls from './components/PlotControls.vue';
import ColorLegend from './components/ColorLegend.vue';
import RidgelinePlot from './components/RidgelinePlot.vue';
import DownloadButton from './components/DownloadButton.vue';
</script>

<template>
  <div class="flex h-screen max-h-screen">
    <div class="flex h-full max-h-full flex-col justify-start gap-y-5">
      <PlotControls />
      <div class="w-75 m-5">
        <ColorLegend />
      </div>
    </div>
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
