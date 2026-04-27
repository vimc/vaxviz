<template>
  <FwbButton @click="downloadModalVisible = true" color="light">
    <span class="flex items-center gap-2 justify-center">
      <DownloadIcon class="size-4" />
      Downloads
    </span>
  </FwbButton>
  <!-- We can't use focus-trap here as its use of preventDefault prevents programmatic downloads -->
  <FwbModal
    v-if="downloadModalVisible"
    @close="handleModalClose"
    :focus-trap="false"
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
        <p class="mb-4">
          These downloadable summary tables contain the mean and median estimates, as well as 95% confidence intervals, of the impact ratios from each set of model runs. All diseases are included where applicable.
        </p>
        <div class="flex gap-4">
          <FwbButton v-if="!openDownload" @click="openDownload = 'location'">Download location-specific estimates</FwbButton>
          <FwbButton v-if="!openDownload" @click="openDownload = 'other'">Other downloads</FwbButton>
          <FwbButton
            v-if="openDownload"
            @click="openDownload = undefined"
            color="light"
            class="ps-1 py-1"
          >
            <span class="flex items-center gap-1">
              <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14 8-4 4 4 4"/>
              </svg>
              Back
            </span>
          </FwbButton>
        </div>
        <hr class="my-4 text-gray-300" v-if="openDownload" />
        <DownloadSelect v-if="openDownload === 'other'" v-model:menu-open="otherDownloadMenuOpen" />
        <LocationDownload v-if="openDownload === 'location'" v-model:menu-open="locationDownloadMenuOpen" />
      </div>
    </template>
  </FwbModal>
</template>

<script setup lang="ts">
import { FwbButton, FwbModal } from 'flowbite-vue';
import { ref } from 'vue';
import DownloadIcon from './DownloadIcon.vue';
import DownloadSelect from './DownloadSelect.vue';
import LocationDownload from './LocationDownload.vue';

const downloadModalVisible = ref(false);
const openDownload = ref<undefined | 'location' | 'other'>();
const locationDownloadMenuOpen = ref(false);
const otherDownloadMenuOpen = ref(false);

const handleModalClose = () => {
  openDownload.value = undefined;
  // If the user presses Escape while the VueSelect menu is open,
  // they probably mean to close only that menu, not the download modal as well.
  if (!otherDownloadMenuOpen.value) {
    downloadModalVisible.value = false
  }
};
</script>

