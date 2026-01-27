<script setup lang="ts">
import PlotControls from './components/PlotControls.vue';
import ColorLegend from './components/ColorLegend.vue';
import RidgelinePlot from './components/RidgelinePlot.vue';
</script>

<template>
  <div class="flex h-screen max-h-screen">
    <header class="sr-only">
      <h1>Vaxviz - Vaccination Coverage Visualization</h1>
    </header>
    <aside class="flex h-full max-h-full flex-col justify-start gap-y-5" role="complementary" aria-label="Plot controls and legend">
      <nav aria-label="Plot configuration">
        <PlotControls />
      </nav>
      <div class="w-75 m-5">
        <ColorLegend />
      </div>
    </aside>
    <main id="main-content" role="main" aria-label="Vaccination data visualization">
      <RidgelinePlot />
    </main>
  </div>
</template>

<style scoped>
</style>
