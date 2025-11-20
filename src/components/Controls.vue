<template>
  <form class="max-w-2xl m-5 flex gap-25">
    <fieldset class="gap-5" aria-required="true">
      <legend class="block mb-5 font-medium text-heading">Explore by:</legend>
      <div>
        <FwbRadio
          v-for="({ label, value }) in exploreOptions"
          :key="value"
          v-model="selectedExploreBy"
          name="exploreBy"
          :label="label"
          :value="value"
          class="mb-2"
          @update:model-value="updateExploreBy"
        />
      </div>
    </fieldset>
    <div class="mb-5 w-full">
      <label for="password" class="block mb-5 font-medium text-heading">
        Focus {{ exploreByLabel.toLocaleLowerCase() }}:
      </label>
      <VueSelect
        v-model="selectedFocus"
        :isClearable="false"
        :options="selectOptions"
        :filter-by="(option, label, search) => label.toLowerCase().includes(search.toLowerCase()) || option.value === 'optgroup'"
      >
        <template #menu-header>
          <div class="p-2 ps-3 disabled-text-color">
            <h3 class="text-sm">Start typing to filter the list...</h3>
          </div>
        </template>
        <template #option="{ option }">
          <h4 v-if="option.value === 'optgroup'" class="font-medium text-sm text-heading disabled-text-color">{{ option.label }}</h4>
          <span v-else class="ps-2">{{ option.label }}</span>
        </template>
      </VueSelect>
    </div>
  </form>
</template>

<script setup lang="ts">
import { FwbRadio } from 'flowbite-vue'
import VueSelect from "vue3-select-component";
import { computed, ref } from 'vue';

const exploreOptions = [
  { label: "Disease", value: "disease" },
  { label: "Geography", value: "geography" },
];

const geographySelectOptions = [
  {
    label: "Global",
    options: [
      { label: "All 117 VIMC countries", value: "global" }
    ]
  },
  {
    label: "Subregions",
    options: [
      { label: "African Region", value: "AFR" },
      { label: "Region of the Americas", value: "AMR" },
      { label: "South-East Asia Region", value: "SEAR" },
      { label: "European Region", value: "EUR" },
      { label: "Eastern Mediterranean Region", value: "EMR" },
      { label: "Western Pacific Region", value: "WPR" }
    ]
  },
  {
    label: "Countries",
    options: [
      { label: "India", value: "IND" },
      { label: "Nigeria", value: "NGA" },
      { label: "Pakistan", value: "PAK" },
      { label: "Indonesia", value: "IDN" }
    ]
  }
];

const diseaseSelectOptions = [
  { label: "Measles", value: "measles" },
  { label: "Hepatitis B", value: "hepb" },
  { label: "Haemophilus influenzae type b", value: "hib" },
  { label: "Yellow Fever", value: "yf" }
];

const selectedFocus = ref("");
const selectedExploreBy = ref("disease");

const exploreByLabel = computed(() => {
  const option = exploreOptions.find(o => o.value === selectedExploreBy.value);
  return option ? option.label : "";
});

const selectOptions = computed(() => {
  if (selectedExploreBy.value === "geography") {
    return geographySelectOptions.map(group => {
      const optgroup = { label: group.label, value: "optgroup", disabled: true };
      return [optgroup, ...group.options];
    }).flat();
  } else if (selectedExploreBy.value === "disease") {
    return diseaseSelectOptions;
  }
  return [];
});

const updateExploreBy = () => {
  selectedFocus.value = selectOptions.value.find(o => o.value !== "optgroup")?.value || "";
};
</script>

<style lang="css" scoped>
.d-flex .col-form-label {
  width: 150px;
}

:deep(.disabled-text-color) {
  color: var(--vs-option-disabled-text-color);
}
</style>
