<template>
  <button
    @click="modalVisible = true"
    class="gap-x-1 text-sm text-gray-500 dark:text-gray-400"
  >
    <p class="sr-only">Help with {{ props.header }}</p>
    <QuestionIcon class="size-4" />
  </button>
  <Teleport to="body">
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FwbModal } from 'flowbite-vue'
import { useHelpInfoStore } from '@/stores/helpInfoStore';
import QuestionIcon from '@/components/icons/QuestionIcon.vue';

const props = defineProps<{
  header: string;
}>();

const helpInfoStore = useHelpInfoStore();

const modalVisible = ref(false);
</script>
