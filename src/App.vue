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
import AppHeader from '@/components/AppHeader.vue';
import PlotControls from '@/components/PlotControls.vue';
import ColorLegend from '@/components/ColorLegend.vue';
import RidgelinePlot from '@/components/RidgelinePlot.vue';
</script>

<style lang="scss">
$header-border-bottom-width: 1px;
$header-padding: calc(var(--spacing)* 5);
$logo-height: calc(var(--spacing)* 20);
$header-height: calc(#{$logo-height} + #{$header-border-bottom-width} + (#{$header-padding} * 3));

$logo-intrinsic-ratio: calc(143/45);
$logo-width: calc(#{$logo-height} * #{$logo-intrinsic-ratio});

header {
  padding: $header-padding;
  margin-bottom: $header-padding;
  max-height: $header-height;

  img#logo {
    height: $logo-height;
    min-width: $logo-width;
  }

  #blurbContainer {
    max-width: $logo-width; // Set to same as logo in order to have heading div centered with respect to header

    p {
      width: max-content; // Overflow blurbContainer
    }
  }
}

main {
  height: calc(100dvh - #{$header-height});
  max-height: calc(100dvh - #{$header-height});
}
</style>
