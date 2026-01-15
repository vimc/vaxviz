<template>
  <FwbAlert
    type="danger"
    class="m-5 h-fit border-t-4 rounded-none w-full"
  >
    <template #icon>
      <img class="w-4 h-4 mr-2" src="@/assets/images/icons/dangerInfoIcon.svg" alt=""/>
      <span class="sr-only">Error</span>
    </template>
    <template #title>
      <h3 class="text-lg font-medium">
        Error loading data
      </h3>
    </template>
    <template #default>
      <p class="mt-2">This may be an intermittent issue. Try refreshing the page.</p>
      <div class="my-2 text-xs">
        <details class="cursor-pointer">
          <summary>Error details</summary>
          <p class="mt-2 text-sm">{{ dataStore.fetchErrors.map(error => error.message).join(', ') }}</p>
        </details>
      </div>
    </template>
  </FwbAlert>
</template>

<script setup lang="ts">
import { FwbAlert } from 'flowbite-vue'
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();
</script>
