<template>
  <div class="flex gap-20">
    <div class="flex flex-col gap-4">
      <label
        id="downloadSelectLabel"
        for="toDownloadSelect"
        class="font-medium text-lg"
      >
        Select files to download
      </label>
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
        <DataErrorAlert
          v-if="downloadErrors.length"
          :errors="downloadErrors"
          title="Error downloading files"
        />
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <h3 class="flex items-center gap-1 font-medium text-lg">
        <svg class="size-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"/>
        </svg>
        Filters
      </h3>
      <DownloadFilters
        v-model:filtered-files="filteredFiles"
        @select-all-files-matching-filters="selectAllFilesMatchingFilters"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { FwbButton } from 'flowbite-vue';
import { computed, ref, watch } from 'vue';
import { useDataStore } from '@/stores/dataStore';
import { Dimension, LocResolution } from '@/types';
import { metricOptions } from '@/utils/options';
import DownloadIcon from './DownloadIcon.vue';
import DownloadFilters from './DownloadFilters.vue';
import DataErrorAlert from "./DataErrorAlert.vue";
import { downloadCsvAsSingleOrZip } from "@/utils/csvDownload";

const csvDataDir = `./data/csv`;
const dataStore = useDataStore();

const filteredFiles = ref<string[]>(dataStore.allPossibleSummaryTables);
// toDownload will be a subset of filteredFiles
// Initialise toDownload to the files relevant to the current plot: this pre-selects them.
const toDownload = ref<string[]>(dataStore.summaryTableFilenames);
const downloadErrors = ref<{ e: Error, message: string }[]>([]);

const menuOpen = defineModel<boolean>('menuOpen', { required: true });

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
    disabled: !filteredFiles.value.includes(fileName),
  }));
});

const selectAllFilesMatchingFilters = (allFiltersUnchecked: boolean) => {
  toDownload.value = allFiltersUnchecked ? [] : filteredFiles.value;
};

const doDownload = async (files: string[]) => {
  downloadErrors.value = [];
  const filenames = files.map((f) => `${f}.csv`);

  try {
    await downloadCsvAsSingleOrZip(csvDataDir, filenames, "vaxviz_download.zip");
  } catch (error) {
    downloadErrors.value.push({
      e: error as Error,
      message: `Error downloading summary tables: ${filenames.join(", ")}. ${error}`,
    });
  }
};

watch(toDownload, () => {
  // Clear any previous download errors when filenames change
  downloadErrors.value = [];
})
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
