<template>
  <FwbButton
    @click="downloadSummaryTables"
    color="light"
    class="cursor-pointer"
  >
    {{ buttonText }}
  </FwbButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FwbButton } from 'flowbite-vue';
import { useSummaryDownload } from '@/composables/useSummaryDownload';

const { summaryTablePaths, downloadSummaryTables } = useSummaryDownload();

const buttonText = computed(() => {
  const count = summaryTablePaths.value.length;
  return count === 1 ? 'Download summary table' : 'Download summary tables';
});
</script>

<style scoped>
</style>
