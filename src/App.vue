<template>
  <AppHeader />
  <main class="flex w-full max-w-full">
    <PlotControls />
    <div class="flex-1 min-w-0 h-full max-h-full flex flex-col gap-y-5">
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
$header-margin-bottom: $header-padding;
$logo-height: calc(var(--spacing)* 20);
$header-height: calc(#{$logo-height} + #{$header-border-bottom-width} + (#{$header-padding} * 2));

$logo-intrinsic-ratio: calc(143/45);
$logo-width: calc(#{$logo-height} * #{$logo-intrinsic-ratio});

header {
  padding: $header-padding;
  margin-bottom: $header-margin-bottom;
  height: $header-height;
  max-height: $header-height;

  img#logo {
    height: $logo-height;
    min-width: $logo-width;
  }

  #blurbContainer {
    max-width: $logo-width; // Set to same as logo in order to have heading div centered with respect to header
    position: absolute;
    top: $header-padding;
    right: $header-padding;
    height: calc(#{$header-height} - (#{$header-padding} * 2));

    p {
      // Overflow blurbContainer horizontally rather than breaking lines which would potentially overflow header vertically
      width: max-content;
    }
  }

  #headingContainer {
    height: calc(#{$header-height} - (#{$header-padding} * 2));
  }
}

main {
  height: calc(100dvh - #{$header-height} - #{$header-margin-bottom});
  max-height: calc(100dvh - #{$header-height} - #{$header-margin-bottom});
}
</style>
