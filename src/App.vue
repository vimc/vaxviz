<script setup lang="ts">
import PlotControls from './components/PlotControls.vue';
import ColorLegend from './components/ColorLegend.vue';
import RidgelinePlot from './components/RidgelinePlot.vue';
</script>

<template>
  <div class="flex h-screen max-h-screen">
    <div class="flex h-full max-h-full flex-col justify-start gap-y-5">
      <PlotControls />
      <div class="w-75 m-5">
        <ColorLegend />
      </div>
    </div>
    <RidgelinePlot />
  </div>
</template>

<style scoped>
</style>
