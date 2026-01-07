<script setup lang="ts">
import PlotControls from './components/PlotControls.vue';
import ColorLegend from './components/ColorLegend.vue';
import RidgelinePlot from './components/RidgelinePlot.vue';
</script>

<template>
  <header class="p-5 mb-5 border-b border-gray-300 flex items-center justify-between">
    <div class="flex flex-col gap-2">
      <img src="/logo.png" class="w-80" alt="VIMC logo" />
    </div>
    <div class="flex flex-col gap-4 max-w-100 items-end">
      <p class="text-right">A short sentence explaining the purpose of the application, with <a href="" target="_blank" class="text-blue-500 underline">
          a link to the paper
      </a></p>
      <a href="" target="_blank" class="text-blue-500 underline">
        About
      </a>
    </div>
  </header>
  <div class="flex h-screen max-h-screen things-container">
    <div class="flex h-full max-h-full flex-col justify-start gap-y-5">
      <PlotControls />
      <div class="w-75 m-5 h-50">
        <ColorLegend />
      </div>
    </div>
    <RidgelinePlot />
  </div>
</template>

<style scoped>
.things-container {
  height: calc(100vh - 200px);
  max-height: calc(100vh - 200px);
}
</style>
