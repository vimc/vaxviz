<template>
  <button
    @click="modalVisible = true"
    class="hover:underline"
  >
    <p class="text-sm text-gray-500" style="text-align: start; line-height: 1.5rem;">
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
      <div class="flex flex-col gap-y-4 leading-relaxed">
        <slot name="body" />
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbModal } from 'flowbite-vue'
import { ref } from 'vue';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const props = defineProps<{
  header: string;
}>();

const helpInfoStore = useHelpInfoStore();

const modalVisible = ref(false);
</script>
