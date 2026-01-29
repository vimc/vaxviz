<template>
  <FwbButton
    @click="doDownload"
    color="light"
    class="cursor-pointer"
  >
    <span class="flex items-center gap-2 justify-center">
      <img class="w-4 h-4" src="@/assets/images/icons/downloadIcon.svg" alt="Download icon" aria-hidden="true" tabindex="-1"/>
      Download summary
    </span>
  </FwbButton>
</template>

<script setup lang="ts">
import { FwbButton } from 'flowbite-vue';
import { useDataStore } from "@/stores/dataStore";

const dataStore = useDataStore();

const doDownload = async () => {
  await dataStore.downloadSummaryTables();
};
</script>
