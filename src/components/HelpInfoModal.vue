<template>
  <div
    v-if="dismissed"
    @click="undismiss"
    class="ml-auto self-end flex items-center gap-x-1 text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
  >
    <svg
      class="size-6 dark:text-white"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.529 9.988a2.502 2.502 0 1 1 5 .191A2.441 2.441 0 0 1 12 12.582V14m-.01 3.008H12M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
    </svg>
    Help with {{ props.header.toLocaleLowerCase() }}
  </div>
  <FwbAlert
    v-else
    icon
    class="w-fit h-full ml-auto"
  >
    <div class="flex flex-col gap-2">
      <div>
        {{ props.alertText }}
      </div>
      <div class="flex">
        <FwbButton
          @click="modalVisible = true"
          size="xs"
          aria-label="Learn more"
          class="rounded"
        >
          Learn more
          <template #suffix>
            <svg class="size-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path clip-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" fill-rule="evenodd" />
            </svg>
          </template>
        </FwbButton>
        <FwbButton
          size="xs"
          outline
          aria-label="Dismiss"
          @click="dismiss"
          class="rounded ml-auto"
        >
          Dismiss
          <template #suffix>
            <svg class="size-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </template>
        </FwbButton>
      </div>
    </div>
  </FwbAlert>
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
import { FwbAlert, FwbButton, FwbModal } from 'flowbite-vue'
import { ref } from 'vue';
import { useHelpInfoStore } from '@/stores/helpInfoStore';

const props = defineProps<{
  id: string;
  alertText: string;
  header: string;
}>();

const helpInfoStore = useHelpInfoStore();
const modalVisible = ref(false);

const wasDismissed = () => localStorage.getItem(`helpInfoDismissed_${props.id}`) === "true";
const dismissed = ref(wasDismissed());

const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem(`helpInfoDismissed_${props.id}`, "true");
}

const undismiss = () => {
  dismissed.value = false;
  localStorage.removeItem(`helpInfoDismissed_${props.id}`);
}
</script>
