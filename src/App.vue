<template>
  <AppHeader />
  <main class="flex">
    <PlotControls />
    <div class="flex flex-col w-full h-full max-w-full max-h-full gap-y-5">
      <RidgelinePlot />
      <ColorLegend />
    </div>
  </main>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
import PlotControls from './components/PlotControls.vue';
import ColorLegend from './components/ColorLegend.vue';
import RidgelinePlot from './components/RidgelinePlot.vue';
</script>

<style lang="scss">
$header-padding: calc(var(--spacing)* 5);
$logo-height: calc(var(--spacing)* 20);

header {
  padding: $header-padding;
  margin-bottom: $header-padding;

  img#logo {
    height: $logo-height;
  }
}

main {
  $header-height: calc(#{$logo-height} + (#{$header-padding} * 3));

  height: calc(100vh - #{$header-height});
  max-height: calc(100vh - #{$header-height});
}
</style>
