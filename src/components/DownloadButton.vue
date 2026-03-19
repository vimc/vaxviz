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
            <VueSelect
              id="toDownloadSelect"
              v-model="toDownload"
              :is-multi="true"
              :is-clearable="toDownload.length > 1"
              :is-menu-open="menuOpen"
              :hide-selected-options="false"
              :close-on-select="false"
              :options="fileOptions"
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
          <div class="flex flex-col gap-4">
            <h3 class="flex items-center gap-1 font-medium text-lg">
              <svg class="size-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"/>
              </svg>
              Filters
            </h3>
            <div class="flex flex-wrap gap-6">
              <fieldset
                v-for="config in filterConfigs"
                :key="config.label"
                class="gap-5 w-fit"
              >
                <legend class="block text-sm mb-2">{{ config.label }}:</legend>
                <div>
                  <FwbCheckbox
                    v-for="opt in config.options"
                    :key="opt.value"
                    v-model="config.filter.value[opt.value]"
                    :label="opt.label"
                    :wrapper-class="'w-fit'"
                  />
                </div>
              </fieldset>
              <div class="w-fit flex flex-col gap-4 ml-auto">
                <FwbButton
                  @click="selectAllFilesMatchingFilters"
                  color="default"
                  class="cursor-pointer w-fit"
                  size="sm"
                >
                  <span class="flex items-center gap-2 justify-center">
                    Select all files matching filters
                  </span>
                </FwbButton>
                <FwbButton
                  color="light"
                  class="cursor-pointer w-50"
                  size="xs"
                  :disabled="filtersAreClear"
                  @click="clearFilters"
                >
                  <span class="flex items-center gap-2 justify-center">
                    Clear filters
                  </span>
                </FwbButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbButton, FwbCheckbox, FwbModal } from 'flowbite-vue';
import VueSelect from "vue3-select-component";
import { useDataStore } from "@/stores/dataStore";
import { useHelpInfoStore } from "@/stores/helpInfoStore";
import { ref, watch, computed } from 'vue';
import { Dimension, LocResolution } from '@/types';
import { metricOptions } from '@/utils/options';
import DownloadIcon from './DownloadIcon.vue';

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

// The 'values' of these options are matched against file names to filter them.
// The exception is: if inverseMatch is true, then we should instead look for file names that
// contain any _other_ option from the set: e.g. when filtering for files with
// global data, filter out the by-country and by-subregion files to find the global ones.
type FilterOption = {
  label: string;
  value: string;
  inverseMatch?: boolean;
};

const filterOptions = [
  {
    label: "Burden metrics",
    options: metricOptions as FilterOption[],
  },
  {
    label: "Geographical resolution",
    options: [
      { label: "By country", value: LocResolution.COUNTRY },
      { label: "By subregion", value: LocResolution.SUBREGION },
      { label: "Global", value: LocResolution.GLOBAL, inverseMatch: true },
    ],
  },
  {
    label: "Activity types",
    options: [
      { label: "Split", value: Dimension.ACTIVITY_TYPE },
      { label: "Not split", value: "not split", inverseMatch: true },
    ],
  }
];

const filterConfigs = filterOptions.map(({ label, options }) => {
  return {
    label,
    options,
    filter: ref(Object.keys(options).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as Record<string, boolean>)),
  };
});

// Derive a subset of all files to be presented as options in the select, based on filter selections.
const filteredFiles = computed(() => dataStore.allPossibleSummaryTables.filter((fileName) => {
  return filterConfigs.every((config) => {
    if (Object.values(config.filter.value).every(filteredIn => filteredIn === false)) {
      // If no checkboxes are selected for this filter, don't apply this filter to files,
      // otherwise deselecting all checkboxes for a filter would result in no files
      // being listed in the select options.
      return true;
    } else {
      return Object.entries(config.filter.value).some(([key, filteredIn]) => {
        const option = config.options.find(({ value }) => value === key);
        if (option?.inverseMatch) {
          const allOtherOptions = config.options.map(({ value }) => value).filter(v => v !== key);
          return filteredIn && allOtherOptions.every((o) => !fileName.includes(o));
        }
        return filteredIn && fileName.includes(key);
      });
    }
  });
}));

const fileOptions = computed(() => {
  return dataStore.allPossibleSummaryTables.map((fileName) => ({
    label: fileLabel(fileName),
    value: fileName,
    disabled: !filteredFiles.value.includes(fileName),
  }));
});

// toDownload will be a subset of filteredFiles
const toDownload = ref<string[]>([]);

const doDownload = async (files: string[]) => {
  // await dataStore.downloadSummaryTables(files);
};

const filtersAreClear = computed(() => {
  return Object.values(filterConfigs).every(({ filter }) => {
    return Object.values(filter.value).every(filteredIn => filteredIn === false);
  });
});

const clearFilters = () => {
  Object.values(filterConfigs).forEach(({ filter }) => {
    Object.keys(filter.value).forEach(key => {
      filter.value[key] = false;
    });
  });
};

const selectAllFilesMatchingFilters = () => {
  const allFiltersUnchecked = Object.values(filterConfigs).every(({ filter }) => {
    return Object.values(filter.value).every(filteredIn => filteredIn === false);
  });

  toDownload.value = allFiltersUnchecked ? [] : filteredFiles.value;
};

watch(downloadModalVisible, (visible) => {
  if (visible) {
    // Initialise toDownload to the files relevant to the current plot: this pre-selects them.
    toDownload.value = dataStore.summaryTableFilenames;
  }
});
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
