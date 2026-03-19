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
    class="wide-modal"
  >
    <template #header>
      <div class="text-lg ps-2 font-medium flex items-center gap-2 justify-center">
        <DownloadIcon class="size-5" />
        Downloads
      </div>
    </template>
    <template #body>
      <div class="flex flex-col gap-y-4 leading-relaxed">
        <p>
          These downloadable summary tables contain the mean and median estimates, as well as 95% confidence intervals, of the impact ratios from each set of model runs. All diseases are included where applicable.
        </p>
        <p>
          By default, the file(s) relevant to the current plot view are pre-selected, but you can select any combination of files to download, either using the filters below to filter the options, or by individually selecting the files from the drop-down.
        </p>
        <div class="flex gap-20">
          <div class="flex flex-col gap-4 w-full">
            <div>
              <label id="downloadSelectLabel" for="toDownloadSelect" class="sr-only">
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
                aria-labelledby="downloadSelectLabel"
                @menu-closed="menuOpen = false"
                @menu-opened="menuOpen = true"
              >
                <template #placeholder>
                  <span class="text-sm">Select files to download</span>
                </template>
              </VueSelect>
            </div>
            <FwbButton
              @click="doDownload(toDownload)"
              color="default"
              class="cursor-pointer mt-auto w-fit"
              :disabled="toDownload.length < 1"
            >
              <span class="flex items-center gap-2 justify-center">
                <DownloadIcon class="size-4" />
                Download {{ toDownload.length }} selected file{{ toDownload.length > 1 ? 's' : '' }} (X KB)
              </span>
            </FwbButton>
            <FwbButton
              @click="doDownload(dataStore.allPossibleSummaryTableFilenames)"
              color="light"
              class="cursor-pointer w-fit"
            >
              <span class="flex items-center gap-2 justify-center">
                <DownloadIcon class="size-4" />
                Download all summary tables (Y KB)
              </span>
            </FwbButton>
          </div>
          <div class="min-w-150">
            <div class="flex items-center gap-4">
              <FwbButton
                color="light"
                class="cursor-pointer w-50"
                @click="onShowHideFilters(filtersOpen)"
              >
                <span class="flex items-center gap-2 justify-center">
                  <svg class="size-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M18.796 4H5.204a1 1 0 0 0-.753 1.659l5.302 6.058a1 1 0 0 1 .247.659v4.874a.5.5 0 0 0 .2.4l3 2.25a.5.5 0 0 0 .8-.4v-7.124a1 1 0 0 1 .247-.659l5.302-6.059c.566-.646.106-1.658-.753-1.658Z"/>
                  </svg>
                  {{ filtersOpen ? 'Hide and clear filters' : 'Show filters' }}
                </span>
              </FwbButton>
              <FwbButton
                v-if="filtersOpen"
                @click="selectAllFilesMatchingFilters"
                color="default"
                class="cursor-pointer w-fit"
              >
                <span class="flex items-center gap-2 justify-center">
                  Select all files matching filters
                </span>
              </FwbButton>
            </div>
            <div :class="{ invisible: !filtersOpen }">
              <div class="flex flex-wrap gap-6 my-10">
                <fieldset class="gap-5 w-fit">
                  <legend class="block text-sm mb-2">Burden metrics:</legend>
                  <div>
                    <FwbCheckbox
                      v-for="metric in metricOptions"
                      :key="metric.value"
                      v-model="burdenMetricFilter[metric.value]"
                      :label="metric.label"
                      :wrapper-class="'w-fit'"
                    />
                  </div>
                </fieldset>
                <fieldset class="gap-5 w-fit">
                  <legend class="block text-sm mb-2">Geographical resolutions:</legend>
                  <div>
                    <FwbCheckbox
                      v-for="geog in Object.keys(geogFilter)"
                      :key="geog"
                      v-model="geogFilter[geog]"
                      :label="geog"
                      :wrapper-class="'w-fit'"
                    />
                  </div>
                </fieldset>
                <fieldset class="gap-5 w-fit">
                  <legend class="block text-sm mb-2">Scales:</legend>
                  <div>
                    <FwbCheckbox
                      v-for="scale in Object.keys(scaleFilter)"
                      :key="scale"
                      v-model="scaleFilter[scale]"
                      :label="scale"
                      :wrapper-class="'w-fit'"
                    />
                  </div>
                </fieldset>
                <fieldset class="gap-5 w-fit">
                  <legend class="block text-sm mb-2">Split by activity type:</legend>
                  <div>
                    <FwbCheckbox
                      v-for="splitBy in Object.keys(activityTypeFilter)"
                      :key="splitBy"
                      v-model="activityTypeFilter[splitBy]"
                      :label="splitBy"
                      :wrapper-class="'w-fit'"
                    />
                  </div>
                </fieldset>
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
import { ref, watch, computed, type Ref } from 'vue';
import { Dimension, LocResolution } from '@/types';
import { metricOptions } from '@/utils/options';
import DownloadIcon from './DownloadIcon.vue';

const dataStore = useDataStore();
const helpInfoStore = useHelpInfoStore();

const downloadModalVisible = ref(false);
const menuOpen = ref(false);
const filtersOpen = ref(false);

const handleModalClose = () => {
  // If the user presses Escape in order to close the VueSelect component, do not interpret this as
  // a signal to close the download modal as well, since this would be unexpected and disruptive to the user.
  if (!menuOpen.value) {
    downloadModalVisible.value = false
  }
};

const fileLabel = (fileName: string) => {
  const fileLabelParts = [];
  metricOptions.forEach((metric) => {
    if (fileName.includes(metric.value)) {
      fileLabelParts.push(metric.label);
    }
  });
  if (fileName.includes(LocResolution.COUNTRY)) {
    fileLabelParts.push("by country");
  } else if (fileName.includes(LocResolution.SUBREGION)) {
    fileLabelParts.push("by subregion");
  } else {
    fileLabelParts.push("(global)")
  }
  if (fileName.includes(Dimension.ACTIVITY_TYPE)) {
    fileLabelParts.push("split by activity type");
  }
  if (fileName.includes("log")) {
    fileLabelParts.push("in log-10 scale");
  } else {
    fileLabelParts.push("in linear scale");
  }
  return `${fileLabelParts.join(" ")} (1.23 KB)`; // TODO: Replace with actual file size.
};


const burdenMetricFilter = ref(metricOptions.reduce((acc, metric) => {
  acc[metric.value] = false;
  return acc;
}, {} as Record<string, boolean>))

const geogFilter = ref(Object.values(LocResolution).reduce((acc, geog) => {
  acc[geog] = false;
  return acc;
}, {} as Record<string, boolean>));

const scaleFilter = ref({
  log: false,
  linear: false,
} as Record<string, boolean>);

const activityTypeFilter = ref({
  "split": false,
  "not split": false,
} as Record<string, boolean>);

const burdenMetricFilterMatchFilename = (fileName: string) => {
  return Object.entries(burdenMetricFilter.value).some(([metric, filteredIn]) => {
    return fileName.includes(metric) && filteredIn
  });
};

const geogFilterMatchFilename = (fileName: string) => {
  return Object.entries(geogFilter.value).some(([geog, filteredIn]) => {
    if (geog === LocResolution.GLOBAL) {
      return filteredIn && !fileName.includes(LocResolution.COUNTRY) && !fileName.includes(LocResolution.SUBREGION);
    } else {
      return fileName.includes(geog) && filteredIn
    }
  });
};

const scaleFilterMatchFilename = (fileName: string) => {
  return Object.entries(scaleFilter.value).some(([scale, filteredIn]) => {
    if (scale === "log") {
      return filteredIn && fileName.includes("log");
    } else if (scale === "linear") {
      return filteredIn && !fileName.includes("log");
    };
  });
};

const activityTypeFilterMatchFilename = (fileName: string) => {
  return Object.entries(activityTypeFilter.value).some(([activityType, filteredIn]) => {
    if (activityType === "split") {
      return filteredIn && fileName.includes(Dimension.ACTIVITY_TYPE);
    } else if (activityType === "not split") {
      return filteredIn && !fileName.includes(Dimension.ACTIVITY_TYPE);
    };
  });
};

const filtersAndMatchers = [
  [burdenMetricFilter, burdenMetricFilterMatchFilename],
  [geogFilter, geogFilterMatchFilename],
  [scaleFilter, scaleFilterMatchFilename],
  [activityTypeFilter, activityTypeFilterMatchFilename]
] as [Ref<Record<string, boolean>>, (fileName: string) => boolean][];

// Derive a subset of all files to be presented as options in the select, based on filter selections.
const filteredFiles = computed(() => dataStore.allPossibleSummaryTableFilenames.filter((fileName) => {
  return filtersAndMatchers.every(([filter, matcher]) => {
    if (Object.values(filter.value).every(filteredIn => filteredIn === false)) {
      // If no checkboxes are selected for this filter, don't apply this filter to files,
      // otherwise deselecting all checkboxes for a filter would result in no files
      // being listed in the select options.
      return true;
    } else {
      return matcher(fileName);
    }
  });
}));

const fileOptions = computed(() => {
  return dataStore.allPossibleSummaryTableFilenames.map(file => ({
    label: fileLabel(file),
    value: file,
    disabled: !filteredFiles.value.includes(file),
  }));
});

// toDownload will be a subset of filteredFiles
const toDownload = ref<string[]>([]);

const doDownload = async (files: string[]) => {
  // await dataStore.downloadSummaryTables(files);
};

const updateAllFilters = async (select: boolean) => {
  filtersAndMatchers.forEach(([filter]) => {
    Object.keys(filter.value).forEach(key => {
      filter.value[key] = select;
    });
  });
};

const onShowHideFilters = (open: boolean) => {
  filtersOpen.value = !open;
  if (!filtersOpen.value) {
    updateAllFilters(false);
  }
};

const selectAllFilesMatchingFilters = () => {
  const allFiltersUnchecked = filtersAndMatchers.every(([filter]) => {
    return Object.values(filter.value).every(filteredIn => filteredIn === false);
  });

  toDownload.value = allFiltersUnchecked ? [] : filteredFiles.value;
}

// Deeply watch each filter
// watch(filtersAndMatchers.map(([filter]) => filter), () => {
//   toDownload.value = filteredFiles.value;
// }, { deep: true });

watch(fileOptions, (newFileOptions) => {
  // If any of the currently selected files are no longer in the filtered options, deselect them.
  toDownload.value = toDownload.value.filter(selectedFile => newFileOptions.some(option => option.value === selectedFile));
});

watch(downloadModalVisible, (visible) => {
  if (visible) {
    // Initialise toDownload to the files relevant to the current plot: this pre-selects them.
    toDownload.value = dataStore.summaryTableFilenames;
  }
});
</script>
