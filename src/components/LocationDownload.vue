<template>
  <div>
    <label id="locationDownloadSelectLabel" class="font-medium text-lg">
      Select location(s)
    </label>
    <div class="flex flex-col gap-4">
      <VueSelect
        v-model="selectedLocations"
        :is-multi="true"
        :is-clearable="selectedLocations.length > 1"
        :is-menu-open="menuOpen"
        :hide-selected-options="false"
        :options="options"
        :aria="{ labelledby: 'locationDownloadSelectLabel' }"
        @menu-closed="menuOpen = false"
        @menu-opened="menuOpen = true"
      >
        <template #placeholder>
          <span class="text-xs">None selected</span>
        </template>
      </VueSelect>
      <div class="flex flex-wrap gap-4">
        <FwbButton
          @click="doDownload(selectedLocations)"
          color="default"
          class="mt-auto w-fit"
          :disabled="!selectedLocations.length"
        >
          <span class="flex items-center gap-2 justify-center">
            <DownloadIcon class="size-4" />
            Download estimates
          </span>
        </FwbButton>
      </div>
      <DataErrorAlert v-if="downloadErrors.length" :errors="downloadErrors" title="Error downloading files" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VueSelect from "vue3-select-component";
import { FwbButton } from 'flowbite-vue';
import { ref, watch } from 'vue';
import { useAppStore } from "@/stores/appStore";
import DownloadIcon from './DownloadIcon.vue';
import DataErrorAlert from "./DataErrorAlert.vue";
import { downloadCsvAsSingleOrZip } from "@/utils/csvDownload";
import { globalOption, locationSelectOptions } from "@/utils/options";
import { BurdenMetric, Dimension, LocResolution } from "@/types";

const appStore = useAppStore();

const options = locationSelectOptions.filter((opt) => opt.value !== globalOption.value && opt.label !== "Global");

// Pre-select the locations based on the filter.
const selectedLocations = ref<string[]>(
  appStore.filters[Dimension.LOCATION]?.filter(l => options.some(opt => opt.value === l)) ?? []
);

const downloadErrors = ref<{ e: Error, message: string }[]>([]);

const menuOpen = defineModel<boolean>('menuOpen', { required: true });

const doDownload = async (locations: string[]) => {
  downloadErrors.value = [];

  const filenames = locations.flatMap((loc) => {
    const resolution = appStore.geographicalResolutionForLocation(loc);
    const safeLoc = loc.replaceAll(" ", "_");
    const subDir = `${resolution}_summary_tables/${safeLoc}_summary_tables`;
    if (resolution === LocResolution.COUNTRY) {
      return Object.values(BurdenMetric).flatMap((metric) => [
        `${subDir}/summary_table_${metric}_disease_activity_type_country_${safeLoc}.csv`,
        `${subDir}/summary_table_${metric}_disease_country_${safeLoc}.csv`,
      ]);
    } else {
      return Object.values(BurdenMetric).flatMap((metric) => [
        `${subDir}/summary_table_${metric}_disease_subregion_activity_type_${safeLoc}.csv`,
        `${subDir}/summary_table_${metric}_disease_subregion_${safeLoc}.csv`,
      ]);
    };
  });

  const zipFilenameLocationPart = locations.length === 1 ? locations[0]!.replaceAll(" ", "_") : "";
  const zipFilename = ["vaxviz", "download", zipFilenameLocationPart].filter(part => part).join("_") + ".zip";

  try {
    await downloadCsvAsSingleOrZip("./data/csv/location_summary_tables", filenames, zipFilename);
  } catch (error) {
    const message = `Error downloading summary tables: ${filenames.join(", ")}. ${error}`;
    downloadErrors.value.push({ e: error as Error, message });
  }
};

watch(selectedLocations, () => {
  // Clear any previous download errors when selection changes
  downloadErrors.value = [];
})
</script>

<style lang="scss" scoped>
:deep(.vue-select) {
  --vs-menu-height: 360px;

  .menu[data-state-position^="bottom"] {
    --vs-menu-height: 500px;
  }
  .menu[data-state-position^="top"] {
    --vs-menu-height: 360px;
  }
}
</style>
