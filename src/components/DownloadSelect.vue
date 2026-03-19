<template>
  <div class="flex flex-col gap-4">
  <VueSelect
    id="toDownloadSelect"
    v-model="toDownload"
    :is-multi="true"
    :is-clearable="toDownload.length > 1"
    :is-menu-open="menuOpen"
    :hide-selected-options="false"
    :close-on-select="false"
    :options="options"
    :classes="{
      control: '!items-start',
    }"
    aria-labelledby="downloadSelectLabel"
    @menu-closed="menuOpen = false"
    @menu-opened="menuOpen = true"
  >
    <template #placeholder>
      <span class="text-xs">None selected</span>
    </template>
  </VueSelect>
  <div class="flex flex-wrap gap-4">
    <FwbButton
      @click="doDownload(toDownload)"
      color="default"
      class="cursor-pointer mt-auto w-fit"
      :disabled="toDownload.length < 1"
    >
      <span class="flex items-center gap-2 justify-center">
        <DownloadIcon class="size-4" />
        Download {{ toDownload.length }} selected file{{ toDownload.length === 1 ? '' : 's' }}
      </span>
    </FwbButton>
    <FwbButton
      @click="doDownload(dataStore.allPossibleSummaryTables)"
      color="light"
      class="cursor-pointer w-fit"
    >
      <span class="flex items-center gap-2 justify-center">
        <DownloadIcon class="size-4" />
        Download all available files
      </span>
    </FwbButton>
  </div>
</div>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { FwbButton } from 'flowbite-vue';
import { computed } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Dimension, LocResolution } from '@/types';
import { metricOptions } from '@/utils/options';
import DownloadIcon from './DownloadIcon.vue';

const dataStore = useDataStore();

const toDownload = defineModel<string[]>('toDownload', { required: true });
const menuOpen = defineModel<boolean>('menuOpen', { required: true });

const props = defineProps<{ filteredFiles: string[] }>();

const fileLabel = (fileName: string) => {
  const fileLabelParts = [];
  metricOptions.forEach((metric) => {
    if (fileName.includes(metric.value)) {
      fileLabelParts.push(`${metric.label.split(" ")[0]} impact ratios`);
    }
  });
  if (fileName.includes(LocResolution.COUNTRY)) {
    fileLabelParts.push(" by country");
  } else if (fileName.includes(LocResolution.SUBREGION)) {
    fileLabelParts.push(" by subregion");
  } else {
    fileLabelParts.push(" globally")
  }
  if (fileName.includes(Dimension.ACTIVITY_TYPE)) {
    fileLabelParts.push(", split by activity type");
  }
  return fileLabelParts.join("");
};

const options = computed(() => {
  return dataStore.allPossibleSummaryTables.map((fileName) => ({
    label: fileLabel(fileName),
    value: fileName,
    disabled: !props.filteredFiles.includes(fileName),
  }));
});


const doDownload = async (files: string[]) => {
  // await dataStore.downloadSummaryTables(files);
};
</script>

<style lang="scss" scoped>
:deep(.vue-select) {
  --vs-min-height: 79px;
  --vs-menu-height: 360px;

  .control {
    // Based on longest file name
    width: 564px;
  }

  .menu[data-state-position^="bottom"] {
    --vs-menu-height: 500px;
  }
  .menu[data-state-position^="top"] {
    --vs-menu-height: 360px;
  }
}
</style>
