<template>
  <EmbargoNotice v-if="embargo"></EmbargoNotice>
  <template v-else>
  <AppHeader />
    <main class="flex w-full max-w-full">
      <PlotControls />
      <RidgelinePlot />
    </main>
  </template>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import EmbargoNotice from "@/components/EmbargoNotice.vue";
import PlotControls from '@/components/PlotControls.vue';
import RidgelinePlot from '@/components/RidgelinePlot.vue';

// Embargo app if built with this env var
const embargo = import.meta.env.VITE_EMBARGO_VAXVIZ
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

// Override a hard-coded color in Flowbite's FwbToggle component
.peer-checked\:bg-blue-600 {
  &:is(:where(.peer):checked ~ *) {
    background-color: var(--color-brand)
  }
}
</style>
