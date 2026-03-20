<template>
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
    <div class="w-fit flex flex-col gap-4 ml-auto items-end">
      <FwbButton
        color="default"
        size="sm"
        @click="selectAllFiles"
      >
        Select all files matching filters
      </FwbButton>
      <FwbButton
        color="light"
        size="sm"
        :disabled="filtersAreClear"
        @click="clearFilters"
      >
        Clear filters
      </FwbButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Dimension, LocResolution } from '@/types';
import { metricOptions } from '@/utils/options';
import { FwbButton, FwbCheckbox } from 'flowbite-vue';
import { computed, ref, watch } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const dataStore = useDataStore();

const emit = defineEmits(['selectAllFilesMatchingFilters']);

// The 'value' properties of these options are matched against file names to filter them.
// The exception is: if inverseMatch is true, then we should instead look for file names that
// contain any _other_ option from the set: e.g. when filtering for files with
// global data, filter out the by-country and by-subregion files to find the global ones.
type FilterOption = { label: string; value: string; inverseMatch?: boolean };

const filterOptions = [
  { label: "Burden metrics", options: metricOptions as FilterOption[] },
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

const filterConfigs = filterOptions.map(({ label, options }) => ({
  label,
  options,
  filter: ref(options.reduce((acc, opt) => {
    acc[opt.value] = false;
    return acc;
  }, {} as Record<string, boolean>)),
}));

const filteredFiles = defineModel<string[]>('filteredFiles', { required: true })

const filtersAreClear = computed(() => {
  return Object.values(filterConfigs).every(({ filter }) => {
    return Object.values(filter.value).every(filteredIn => filteredIn === false);
  });
});

watch(filterConfigs.map(config => config.filter), () => {
  // When a filter changes,
  // derive a subset of all files to be presented as options in the select, based on filter selections.
  filteredFiles.value = dataStore.allPossibleSummaryTables.filter((fileName) => {
    return filterConfigs.every((config) => {
      if (Object.values(config.filter.value).every(filteredIn => filteredIn === false)) {
        // If no checkboxes are selected for this filter, don't apply this filter to files,
        // otherwise deselecting all checkboxes for a filter would result in no files
        // being listed in the select options.
        return true;
      } else {
        return Object.entries(config.filter.value).some(([key, filteredIn]) => {
          const option = config.options.find(({ value }) => value === key);
          if (option!.inverseMatch) {
            const allOtherOptions = config.options.map(({ value }) => value).filter(v => v !== key);
            return filteredIn && allOtherOptions.every((o) => !fileName.includes(o));
          }
          return filteredIn && fileName.includes(key);
        });
      }
    });
  });
}, { deep: true });

const clearFilters = () => {
  Object.values(filterConfigs).forEach(({ filter }) => {
    Object.keys(filter.value).forEach(key => { filter.value[key] = false });
  });
};

const selectAllFiles = () => emit('selectAllFilesMatchingFilters', filtersAreClear.value);
</script>
