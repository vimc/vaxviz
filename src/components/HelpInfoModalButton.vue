<template>
  <button
    id="helpButton"
    @click="modalVisible = true"
    class="hover:underline"
    :class="{
      animationsAllowed,
      allowInitialAnimation: helpInfoStore.negativeHelpInfoShowCount <= 1
    }"
  >
    <p
      class="help-text text-sm text-gray-500"
      :class="{ highlight }"
      style="text-align: start; line-height: 1.5rem;"
    >
      <img class="w-4 h-4 mr-1 mb-1 inline" src="@/assets/images/icons/questionMark.svg" alt="Help icon"/>
      {{ props.header}}
    </p>
  </button>
  <FwbModal
    v-if="modalVisible"
    @close="modalVisible = false"
    :focus-trap="helpInfoStore.enableFocusTraps"
  >
    <template #header>
      <div class="text-lg font-medium ps-2">
        {{ props.header }}
      </div>
    </template>
    <template #body>
      <slot name="body" />
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbModal } from 'flowbite-vue'
import { computed, ref } from 'vue';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const props = defineProps<{
  header: string;
  animationsAllowed?: boolean;
}>();

const helpInfoStore = useHelpInfoStore();

const modalVisible = ref(false);

const highlight = computed(() => {
  return props.animationsAllowed
    && helpInfoStore.highlightNegativeValuesHelpMessage
    && helpInfoStore.negativeHelpInfoHighlightCount <= 1;
})
</script>

<style lang="scss" scoped>
// Initial animation for the first time the negative values help info button is shown in a session.
@keyframes pop-in {
  0% {
    opacity: 0;
    transform: translateY(80px) scale(0.9);
  }
  70% {
    opacity: 1;
    transform: translateY(0) scale(1.06);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// animation applied when the user hovers over a point with a negative value
// for the first time during the session
@keyframes help-text-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animationsAllowed {
  @media not (prefers-reduced-motion: reduce) {
    &#helpButton.allowInitialAnimation {
      animation: pop-in 260ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
      animation-delay: 5s;
      transform-origin: center;
    }

    &#helpButton p.help-text.highlight {
      transform-origin: center;
      animation: help-text-pulse 400ms ease-in-out 3;
    }
  }
}
</style>
