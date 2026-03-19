<template>
  <FwbButton
    @click="downloadModalVisible = true"
    color="light"
    class="cursor-pointer"
  >
    <span class="flex items-center gap-2 justify-center">
      <DownloadIcon class="size-4" />
      Downloads
    </span>
  </FwbButton>
  <FwbModal
    v-if="downloadModalVisible"
    @close="handleModalClose"
    :focus-trap="helpInfoStore.enableFocusTraps"
    class="wide-modal top-modal"
  >
    <template #header>
      <div class="text-lg ps-2 font-medium flex items-center gap-2 justify-center">
        <DownloadIcon class="size-5" />
        Downloads
      </div>
    </template>
    <template #body>
      <div>
        <div class="mb-8 flex flex-col leading-relaxed gap-y-4">
          <p>
            These downloadable summary tables contain the mean and median estimates, as well as 95% confidence intervals, of the impact ratios from each set of model runs. All diseases are included where applicable.
          </p>
          <p>
            By default, the file(s) relevant to the current plot view are pre-selected, but you can select any combination of files to download, either using the filters below to filter the options, or by individually selecting the files from the drop-down.
          </p>
        </div>
        <div class="flex gap-20">
          <div class="flex flex-col gap-4">
            <label
              id="downloadSelectLabel"
              for="toDownloadSelect"
              class="font-medium text-lg"
            >
              Select files to download
            </label>
            <DownloadSelect
              :filtered-files="filteredFiles"
              v-model:menu-open="menuOpen"
              v-model:to-download="toDownload"
            />
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
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbButton, FwbModal } from 'flowbite-vue';
import { useDataStore } from "@/stores/dataStore";
import { useHelpInfoStore } from "@/stores/helpInfoStore";
import { ref, watch } from 'vue';
import DownloadIcon from './DownloadIcon.vue';
import DownloadSelect from './DownloadSelect.vue';
import DownloadFilters from './DownloadFilters.vue';

const dataStore = useDataStore();
const helpInfoStore = useHelpInfoStore();

const downloadModalVisible = ref(false);
const menuOpen = ref(false);

const handleModalClose = () => {
  // If the user presses Escape while the VueSelect menu is open,
  // they probably mean to close only that menu, not the download modal as well.
  if (!menuOpen.value) {
    downloadModalVisible.value = false
  }
};

// filteredFiles is initialized here (for state sharing) but updated by the filters component
const filteredFiles = ref<string[]>(dataStore.allPossibleSummaryTables);

// toDownload will be a subset of filteredFiles
const toDownload = ref<string[]>([]);

const selectAllFilesMatchingFilters = (allFiltersUnchecked: boolean) => {
  toDownload.value = allFiltersUnchecked ? [] : filteredFiles.value;
};

watch(downloadModalVisible, (visible) => {
  if (visible) {
    // Initialise toDownload to the files relevant to the current plot: this pre-selects them.
    toDownload.value = dataStore.summaryTableFilenames;
  }
});
</script>

