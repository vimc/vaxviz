<template>
  <FwbAlert
    v-if="props.errors.length"
    type="danger"
    class="m-5 h-fit border-t-4 rounded-none w-full"
  >
    <template #icon>
      <img class="size-4 mr-2" src="@/assets/images/icons/dangerInfoIcon.svg" alt=""/>
      <span class="sr-only">Error</span>
    </template>
    <template #title>
      <h2 class="text-lg font-medium">
        {{ title }}
      </h2>
    </template>
    <template #default>
      <p class="mt-2">This may be an intermittent issue. Try again or try refreshing the page.</p>
      <div class="my-2 text-xs">
        <details class="cursor-pointer">
          <summary>Error details</summary>
          <p class="mt-2 text-sm">{{ props.errors.map(error => error.message).join(', ') }}</p>
        </details>
      </div>
    </template>
  </FwbAlert>
</template>

<script setup lang="ts">
import { FwbAlert } from 'flowbite-vue'

const props = defineProps<{
  errors: { e: Error, message: string }[];
  title: string;
}>();
</script>
